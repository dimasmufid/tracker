"use server";

import { db, tasks, taskRecords, projects, activities } from "@/db/schema";
import { eq, and, desc, isNull, inArray } from "drizzle-orm";
import { normalizeTimestamp } from "@/utils/timeUtils";

export async function getTasks() {
  return await db.select().from(tasks).orderBy(desc(tasks.createdAt));
}

export async function getProjects() {
  return await db.select().from(projects).orderBy(desc(projects.createdAt));
}

export async function getActivities() {
  return await db.select().from(activities).orderBy(desc(activities.createdAt));
}

export async function getTaskRecords(taskId?: number) {
  if (taskId) {
    return await db
      .select()
      .from(taskRecords)
      .where(eq(taskRecords.taskId, taskId))
      .orderBy(desc(taskRecords.startedAt));
  }

  return await db
    .select()
    .from(taskRecords)
    .orderBy(desc(taskRecords.startedAt));
}

export async function startTaskTracking(taskId: number) {
  console.log("Starting tracking for task ID:", taskId);

  // First, check if the task exists
  const taskExists = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(eq(tasks.id, taskId))
    .limit(1);

  if (taskExists.length === 0) {
    console.error(`Task with ID ${taskId} does not exist in the database`);
    throw new Error(`Task with ID ${taskId} does not exist`);
  }

  // Check if there's already an active tracking session
  const activeRecord = await db
    .select()
    .from(taskRecords)
    .where(isNull(taskRecords.endedAt))
    .limit(1);

  // If there's an active session, end it first
  if (activeRecord.length > 0) {
    await db
      .update(taskRecords)
      .set({ endedAt: new Date() })
      .where(eq(taskRecords.id, activeRecord[0].id));
  }

  // Start a new tracking session
  try {
    const result = await db
      .insert(taskRecords)
      .values({
        taskId,
        startedAt: new Date(),
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

  try {
    // Find the active record for this task
    const activeRecord = await db
      .select()
      .from(taskRecords)
      .where(and(eq(taskRecords.taskId, taskId), isNull(taskRecords.endedAt)))
      .orderBy(desc(taskRecords.startedAt)) // Get the most recent one if multiple
      .limit(1);

    if (activeRecord.length === 0) {
      console.log("No active tracking session found for task ID:", taskId);

      // Check if the task exists
      const taskExists = await db
        .select({ id: tasks.id })
        .from(tasks)
        .where(eq(tasks.id, taskId))
        .limit(1);

      if (taskExists.length === 0) {
        console.error(`Task with ID ${taskId} does not exist in the database`);
        throw new Error(`Task with ID ${taskId} does not exist`);
      }

      return null;
    }

    try {
      // End the tracking session
      const result = await db
        .update(taskRecords)
        .set({ endedAt: new Date() })
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
    // Find the active record
    const activeRecords = await db
      .select()
      .from(taskRecords)
      .where(isNull(taskRecords.endedAt))
      .orderBy(desc(taskRecords.startedAt)); // Get the most recent ones

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
          .set({ endedAt: new Date() })
          .where(eq(taskRecords.id, activeRecords[i].id));

        console.log(`Closed orphaned active record: ${activeRecords[i].id}`);
      }

      // Continue with the most recent record
      const activeRecord = mostRecentRecord;

      // Get the task for this record
      const task = await db
        .select()
        .from(tasks)
        .where(eq(tasks.id, activeRecord.taskId))
        .limit(1);

      // If the task doesn't exist but we have an active record, close the record
      if (task.length === 0) {
        console.warn(
          `Active record found for non-existent task ID: ${activeRecord.taskId}. Closing record.`
        );
        await db
          .update(taskRecords)
          .set({ endedAt: new Date() })
          .where(eq(taskRecords.id, activeRecord.id));
        return null;
      }

      return task[0];
    } else {
      // Just one active record, proceed normally
      const activeRecord = activeRecords[0];

      // Get the task for this record
      const task = await db
        .select()
        .from(tasks)
        .where(eq(tasks.id, activeRecord.taskId))
        .limit(1);

      // If the task doesn't exist but we have an active record, close the record
      if (task.length === 0) {
        console.warn(
          `Active record found for non-existent task ID: ${activeRecord.taskId}. Closing record.`
        );
        await db
          .update(taskRecords)
          .set({ endedAt: new Date() })
          .where(eq(taskRecords.id, activeRecord.id));
        return null;
      }

      return task[0];
    }
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
  const records = await getTaskRecords(taskId);

  let totalTime = 0;
  records.forEach((record) => {
    const startTime = normalizeTimestamp(record.startedAt) || 0;
    const endTime = record.endedAt
      ? normalizeTimestamp(record.endedAt) || 0
      : Date.now();
    totalTime += Math.max(0, endTime - startTime);
  });

  return totalTime;
}

/**
 * Calculate the total time spent on all tasks in a project
 * @param projectId The ID of the project
 * @returns Total duration in milliseconds
 */
export async function calculateProjectTotalTime(projectId: number) {
  // Get all tasks for this project
  const projectTasks = await db
    .select()
    .from(tasks)
    .where(eq(tasks.projectId, projectId));

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
      taskIds.length === 1
        ? eq(taskRecords.taskId, taskIds[0])
        : inArray(taskRecords.taskId, taskIds)
    );

  // Calculate total time
  let totalTime = 0;
  allRecords.forEach((record) => {
    const startTime = normalizeTimestamp(record.startedAt) || 0;
    const endTime = record.endedAt
      ? normalizeTimestamp(record.endedAt) || 0
      : Date.now();
    totalTime += Math.max(0, endTime - startTime);
  });

  return totalTime;
}

export async function createTask(
  name: string,
  projectId: number,
  activityId: number
) {
  console.log("Creating task in database:", { name, projectId, activityId });
  try {
    const result = await db
      .insert(tasks)
      .values({
        name,
        projectId,
        activityId,
        createdAt: new Date(),
      })
      .returning();

    console.log("Task created in database:", result);
    return result[0];
  } catch (error) {
    console.error("Error creating task:", error);
    throw error;
  }
}

export async function checkTaskExists(taskId: number): Promise<boolean> {
  console.log("Checking if task exists:", taskId);
  try {
    const taskExists = await db
      .select({ id: tasks.id })
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);

    const exists = taskExists.length > 0;
    console.log(`Task ${taskId} exists: ${exists}`);
    return exists;
  } catch (error) {
    console.error("Error checking if task exists:", error);
    return false;
  }
}
