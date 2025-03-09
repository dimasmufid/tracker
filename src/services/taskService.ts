"use server";

import { db, tasks, taskRecords, projects, activities } from "@/db/schema";
import { eq, and, desc, isNull, inArray } from "drizzle-orm";
import { normalizeTimestamp } from "@/utils/timeUtils";
import { getCurrentUserId } from "@/lib/auth";

export async function getTasks() {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  return await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.user_id, userId), eq(tasks.is_deleted, false)))
    .orderBy(desc(tasks.created_at));
}

export async function getProjects() {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  return await db
    .select()
    .from(projects)
    .where(and(eq(projects.user_id, userId), eq(projects.is_deleted, false)))
    .orderBy(desc(projects.created_at));
}

export async function getActivities() {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  return await db
    .select()
    .from(activities)
    .where(
      and(eq(activities.user_id, userId), eq(activities.is_deleted, false))
    )
    .orderBy(desc(activities.created_at));
}

export async function getTaskRecords(taskId?: number) {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  if (taskId) {
    return await db
      .select()
      .from(taskRecords)
      .where(
        and(
          eq(taskRecords.task_id, taskId),
          eq(taskRecords.user_id, userId),
          eq(taskRecords.is_deleted, false)
        )
      )
      .orderBy(desc(taskRecords.started_at));
  }

  return await db
    .select()
    .from(taskRecords)
    .where(
      and(eq(taskRecords.user_id, userId), eq(taskRecords.is_deleted, false))
    )
    .orderBy(desc(taskRecords.started_at));
}

export async function startTaskTracking(taskId: number) {
  console.log("Starting tracking for task ID:", taskId);

  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  // Verify that the task exists and belongs to the user
  const taskExists = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(
      and(
        eq(tasks.id, taskId),
        eq(tasks.user_id, userId),
        eq(tasks.is_deleted, false)
      )
    )
    .limit(1);

  if (taskExists.length === 0) {
    throw new Error(
      `Task with ID ${taskId} does not exist, doesn't belong to the user, or has been deleted`
    );
  }

  // Check if there's already an active tracking session for this user
  const activeRecord = await db
    .select()
    .from(taskRecords)
    .where(and(isNull(taskRecords.ended_at), eq(taskRecords.user_id, userId)))
    .limit(1);

  // If there's an active session, end it first
  if (activeRecord.length > 0) {
    await db
      .update(taskRecords)
      .set({ ended_at: new Date() })
      .where(eq(taskRecords.id, activeRecord[0].id));
  }

  // Start a new tracking session
  try {
    const result = await db
      .insert(taskRecords)
      .values({
        task_id: taskId,
        started_at: new Date(),
        user_id: userId,
      })
      .returning();

    console.log("New tracking session started:", result);
    return result;
  } catch (error) {
    console.error("Error starting tracking session:", error);
    throw error;
  }
}

export async function stopTaskTracking(taskId: number) {
  console.log("Stopping tracking for task ID:", taskId);

  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  try {
    // Find the active record for this task and user
    const activeRecord = await db
      .select()
      .from(taskRecords)
      .where(
        and(
          eq(taskRecords.task_id, taskId),
          isNull(taskRecords.ended_at),
          eq(taskRecords.user_id, userId),
          eq(taskRecords.is_deleted, false)
        )
      )
      .orderBy(desc(taskRecords.started_at)) // Get the most recent one if multiple
      .limit(1);

    if (activeRecord.length === 0) {
      console.log("No active tracking session found for task ID:", taskId);

      // Check if the task exists and belongs to the user
      const taskExists = await db
        .select({ id: tasks.id })
        .from(tasks)
        .where(
          and(
            eq(tasks.id, taskId),
            eq(tasks.user_id, userId),
            eq(tasks.is_deleted, false)
          )
        )
        .limit(1);

      if (taskExists.length === 0) {
        console.error(
          `Task with ID ${taskId} does not exist, doesn't belong to the user, or has been deleted`
        );
        throw new Error(
          `Task with ID ${taskId} does not exist, doesn't belong to the user, or has been deleted`
        );
      }

      return null;
    }

    try {
      // End the tracking session
      const result = await db
        .update(taskRecords)
        .set({ ended_at: new Date() })
        .where(eq(taskRecords.id, activeRecord[0].id))
        .returning();

      console.log("Tracking session stopped:", result);
      return result;
    } catch (error) {
      console.error("Error stopping tracking session:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in stopTaskTracking:", error);
    throw error;
  }
}

export async function getActiveTask() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return null;

    // Find the active record
    const activeRecords = await db
      .select()
      .from(taskRecords)
      .where(
        and(
          isNull(taskRecords.ended_at),
          eq(taskRecords.user_id, userId),
          eq(taskRecords.is_deleted, false)
        )
      )
      .orderBy(desc(taskRecords.started_at)); // Get the most recent ones

    if (activeRecords.length === 0) {
      console.log("No active records found");
      return null;
    }

    // If there are multiple active records, close all but the most recent one
    if (activeRecords.length > 1) {
      console.warn(
        `Found ${activeRecords.length} active records. Closing all but the most recent.`
      );

      // Keep the most recent record open
      const mostRecentRecord = activeRecords[0];

      // Close all other records
      for (let i = 1; i < activeRecords.length; i++) {
        await db
          .update(taskRecords)
          .set({ ended_at: new Date() })
          .where(eq(taskRecords.id, activeRecords[i].id));

        console.log(`Closed orphaned active record: ${activeRecords[i].id}`);
      }

      // Continue with the most recent record
      const activeRecord = mostRecentRecord;

      // Get the task for this record
      const task = await db
        .select()
        .from(tasks)
        .where(
          and(
            eq(tasks.id, activeRecord.task_id),
            eq(tasks.user_id, userId),
            eq(tasks.is_deleted, false)
          )
        )
        .limit(1);

      // If the task doesn't exist but we have an active record, close the record
      if (task.length === 0) {
        console.warn(
          `Active record found for non-existent task ID: ${activeRecord.task_id}. Closing record.`
        );
        await db
          .update(taskRecords)
          .set({ ended_at: new Date() })
          .where(eq(taskRecords.id, activeRecord.id));
        return null;
      }

      return task[0];
    }
    // Just one active record, proceed normally
    const activeRecord = activeRecords[0];

    // Get the task for this record
    const task = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.id, activeRecord.task_id),
          eq(tasks.user_id, userId),
          eq(tasks.is_deleted, false)
        )
      )
      .limit(1);

    // If the task doesn't exist but we have an active record, close the record
    if (task.length === 0) {
      console.warn(
        `Active record found for non-existent task ID: ${activeRecord.task_id}. Closing record.`
      );
      await db
        .update(taskRecords)
        .set({ ended_at: new Date() })
        .where(eq(taskRecords.id, activeRecord.id));
      return null;
    }

    return task[0];
  } catch (error) {
    console.error("Error getting active task:", error);
    return null;
  }
}

/**
 * Calculate the total time spent on a task
 * @param taskId The ID of the task
 * @returns Total duration in milliseconds
 */
export async function calculateTaskTotalTime(taskId: number) {
  const userId = await getCurrentUserId();
  if (!userId) return 0;

  try {
    // Verify that the task exists and belongs to the user
    const taskExists = await db
      .select({ id: tasks.id })
      .from(tasks)
      .where(
        and(
          eq(tasks.id, taskId),
          eq(tasks.user_id, userId),
          eq(tasks.is_deleted, false)
        )
      )
      .limit(1);

    if (taskExists.length === 0) {
      console.error(
        `Task with ID ${taskId} does not exist, doesn't belong to the user, or has been deleted`
      );
      return 0;
    }

    // Get all completed records for this task
    const records = await db
      .select()
      .from(taskRecords)
      .where(
        and(
          eq(taskRecords.task_id, taskId),
          eq(taskRecords.user_id, userId),
          eq(taskRecords.is_deleted, false)
        )
      );

    // Calculate total time
    let totalTime = 0;
    records.forEach((record) => {
      const startTime = normalizeTimestamp(record.started_at) || 0;
      const endTime = record.ended_at
        ? normalizeTimestamp(record.ended_at) || 0
        : Date.now();
      totalTime += Math.max(0, endTime - startTime);
    });

    return totalTime;
  } catch (error) {
    console.error("Error calculating task total time:", error);
    return 0;
  }
}

/**
 * Calculate the total time spent on all tasks in a project
 * @param projectId The ID of the project
 * @returns Total duration in milliseconds
 */
export async function calculateProjectTotalTime(projectId: number) {
  const userId = await getCurrentUserId();
  if (!userId) return 0;

  try {
    // Verify that the project exists and belongs to the user
    const projectExists = await db
      .select({ id: projects.id })
      .from(projects)
      .where(
        and(
          eq(projects.id, projectId),
          eq(projects.user_id, userId),
          eq(projects.is_deleted, false)
        )
      )
      .limit(1);

    if (projectExists.length === 0) {
      console.error(
        `Project with ID ${projectId} does not exist, doesn't belong to the user, or has been deleted`
      );
      return 0;
    }

    // Get all tasks for this project
    const projectTasks = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.project_id, projectId),
          eq(tasks.user_id, userId),
          eq(tasks.is_deleted, false)
        )
      );

    // Get all task records for these tasks in a single query
    const taskIds = projectTasks.map((task) => task.id);

    if (taskIds.length === 0) {
      return 0;
    }

    // Use a more efficient query to get all records at once
    const allRecords = await db
      .select()
      .from(taskRecords)
      .where(
        and(
          taskIds.length === 1
            ? eq(taskRecords.task_id, taskIds[0])
            : inArray(taskRecords.task_id, taskIds),
          eq(taskRecords.user_id, userId)
        )
      );

    // Calculate total time
    let totalTime = 0;
    allRecords.forEach((record) => {
      const startTime = normalizeTimestamp(record.started_at) || 0;
      const endTime = record.ended_at
        ? normalizeTimestamp(record.ended_at) || 0
        : Date.now();
      totalTime += Math.max(0, endTime - startTime);
    });

    return totalTime;
  } catch (error) {
    console.error("Error calculating project total time:", error);
    return 0;
  }
}

export async function createTask(
  name: string,
  projectId: number,
  activityId: number
) {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  // Verify that the project and activity exist and belong to the user
  const projectExists = await db
    .select({ id: projects.id })
    .from(projects)
    .where(
      and(
        eq(projects.id, projectId),
        eq(projects.user_id, userId),
        eq(projects.is_deleted, false)
      )
    )
    .limit(1);

  if (projectExists.length === 0) {
    throw new Error(
      `Project with ID ${projectId} does not exist, doesn't belong to the user, or has been deleted`
    );
  }

  const activityExists = await db
    .select({ id: activities.id })
    .from(activities)
    .where(
      and(
        eq(activities.id, activityId),
        eq(activities.user_id, userId),
        eq(activities.is_deleted, false)
      )
    )
    .limit(1);

  if (activityExists.length === 0) {
    throw new Error(
      `Activity with ID ${activityId} does not exist, doesn't belong to the user, or has been deleted`
    );
  }

  try {
    const result = await db
      .insert(tasks)
      .values({
        name,
        project_id: projectId,
        activity_id: activityId,
        user_id: userId,
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error("Error creating task:", error);
    throw error;
  }
}

export async function checkTaskExists(taskId: number): Promise<boolean> {
  const userId = await getCurrentUserId();
  if (!userId) return false;

  try {
    const result = await db
      .select({ id: tasks.id })
      .from(tasks)
      .where(
        and(
          eq(tasks.id, taskId),
          eq(tasks.user_id, userId),
          eq(tasks.is_deleted, false)
        )
      )
      .limit(1);

    return result.length > 0;
  } catch (error) {
    console.error("Error checking if task exists:", error);
    return false;
  }
}

export async function updateTask(
  taskId: number,
  name: string,
  projectId: number,
  activityId: number
) {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  // Verify that the task exists and belongs to the user
  const taskExists = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(
      and(
        eq(tasks.id, taskId),
        eq(tasks.user_id, userId),
        eq(tasks.is_deleted, false)
      )
    )
    .limit(1);

  if (taskExists.length === 0) {
    throw new Error(
      `Task with ID ${taskId} does not exist, doesn't belong to the user, or has been deleted`
    );
  }

  // Verify that the project and activity exist and belong to the user
  const projectExists = await db
    .select({ id: projects.id })
    .from(projects)
    .where(
      and(
        eq(projects.id, projectId),
        eq(projects.user_id, userId),
        eq(projects.is_deleted, false)
      )
    )
    .limit(1);

  if (projectExists.length === 0) {
    throw new Error(
      `Project with ID ${projectId} does not exist, doesn't belong to the user, or has been deleted`
    );
  }

  const activityExists = await db
    .select({ id: activities.id })
    .from(activities)
    .where(
      and(
        eq(activities.id, activityId),
        eq(activities.user_id, userId),
        eq(activities.is_deleted, false)
      )
    )
    .limit(1);

  if (activityExists.length === 0) {
    throw new Error(
      `Activity with ID ${activityId} does not exist, doesn't belong to the user, or has been deleted`
    );
  }

  try {
    const result = await db
      .update(tasks)
      .set({
        name,
        project_id: projectId,
        activity_id: activityId,
        // We don't update user_id as it should remain the same
      })
      .where(and(eq(tasks.id, taskId), eq(tasks.user_id, userId)))
      .returning();

    return result[0];
  } catch (error) {
    console.error("Error updating task:", error);
    throw error;
  }
}

// Soft delete functions
export async function softDeleteProject(projectId: number) {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  // Verify that the project exists and belongs to the user
  const projectExists = await db
    .select({ id: projects.id })
    .from(projects)
    .where(
      and(
        eq(projects.id, projectId),
        eq(projects.user_id, userId),
        eq(projects.is_deleted, false)
      )
    )
    .limit(1);

  if (projectExists.length === 0) {
    throw new Error(
      `Project with ID ${projectId} does not exist, doesn't belong to the user, or has been deleted`
    );
  }

  try {
    // Soft delete the project
    await db
      .update(projects)
      .set({ is_deleted: true })
      .where(and(eq(projects.id, projectId), eq(projects.user_id, userId)));

    // Also soft delete all tasks associated with this project
    const projectTasks = await db
      .select({ id: tasks.id })
      .from(tasks)
      .where(
        and(
          eq(tasks.project_id, projectId),
          eq(tasks.user_id, userId),
          eq(tasks.is_deleted, false)
        )
      );

    if (projectTasks.length > 0) {
      const taskIds = projectTasks.map((task) => task.id);

      // Soft delete the tasks
      await db
        .update(tasks)
        .set({ is_deleted: true })
        .where(and(inArray(tasks.id, taskIds), eq(tasks.user_id, userId)));

      // Soft delete the task records associated with these tasks
      await db
        .update(taskRecords)
        .set({ is_deleted: true })
        .where(
          and(
            inArray(taskRecords.task_id, taskIds),
            eq(taskRecords.user_id, userId)
          )
        );
    }

    return true;
  } catch (error) {
    console.error("Error soft deleting project:", error);
    throw error;
  }
}

export async function softDeleteActivity(activityId: number) {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  // Verify that the activity exists and belongs to the user
  const activityExists = await db
    .select({ id: activities.id })
    .from(activities)
    .where(
      and(
        eq(activities.id, activityId),
        eq(activities.user_id, userId),
        eq(activities.is_deleted, false)
      )
    )
    .limit(1);

  if (activityExists.length === 0) {
    throw new Error(
      `Activity with ID ${activityId} does not exist, doesn't belong to the user, or has been deleted`
    );
  }

  try {
    // Soft delete the activity
    await db
      .update(activities)
      .set({ is_deleted: true })
      .where(
        and(eq(activities.id, activityId), eq(activities.user_id, userId))
      );

    // Also soft delete all tasks associated with this activity
    const activityTasks = await db
      .select({ id: tasks.id })
      .from(tasks)
      .where(
        and(
          eq(tasks.activity_id, activityId),
          eq(tasks.user_id, userId),
          eq(tasks.is_deleted, false)
        )
      );

    if (activityTasks.length > 0) {
      const taskIds = activityTasks.map((task) => task.id);

      // Soft delete the tasks
      await db
        .update(tasks)
        .set({ is_deleted: true })
        .where(and(inArray(tasks.id, taskIds), eq(tasks.user_id, userId)));

      // Soft delete the task records associated with these tasks
      await db
        .update(taskRecords)
        .set({ is_deleted: true })
        .where(
          and(
            inArray(taskRecords.task_id, taskIds),
            eq(taskRecords.user_id, userId)
          )
        );
    }

    return true;
  } catch (error) {
    console.error("Error soft deleting activity:", error);
    throw error;
  }
}

export async function softDeleteTask(taskId: number) {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  // Verify that the task exists and belongs to the user
  const taskExists = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(
      and(
        eq(tasks.id, taskId),
        eq(tasks.user_id, userId),
        eq(tasks.is_deleted, false)
      )
    )
    .limit(1);

  if (taskExists.length === 0) {
    throw new Error(
      `Task with ID ${taskId} does not exist, doesn't belong to the user, or has been deleted`
    );
  }

  try {
    // Soft delete the task
    await db
      .update(tasks)
      .set({ is_deleted: true })
      .where(and(eq(tasks.id, taskId), eq(tasks.user_id, userId)));

    // Also soft delete all task records associated with this task
    await db
      .update(taskRecords)
      .set({ is_deleted: true })
      .where(
        and(eq(taskRecords.task_id, taskId), eq(taskRecords.user_id, userId))
      );

    return true;
  } catch (error) {
    console.error("Error soft deleting task:", error);
    throw error;
  }
}
