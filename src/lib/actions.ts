"use server";

import { db } from "@/db/schema";
import * as schema from "@/db/schema";
import { revalidatePath } from "next/cache";
import {
  ActivityFormValues,
  ProjectFormValues,
  TaskFormValues,
} from "./schemas";
import { eq, and } from "drizzle-orm";
import {
  softDeleteProject,
  softDeleteActivity,
  softDeleteTask,
} from "@/services/taskService";
import { getCurrentUserId } from "./auth-utils";

export async function addProject(data: ProjectFormValues) {
  try {
    console.log("addProject called with data:", data);

    // Get a valid user ID directly
    const userId = await getCurrentUserId();
    console.log("User ID from getCurrentUserId:", userId);

    // Create project data with the valid user ID
    const projectData = {
      name: data.name,
      description: data.description,
      color: data.color,
      user_id: userId,
    };
    console.log("Project data to insert:", projectData);

    // Insert the project
    await db.insert(schema.projects).values(projectData);
    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error("Error adding project:", error);
    throw error;
  }
}

export async function editProject(id: number, data: ProjectFormValues) {
  try {
    console.log("editProject called with id:", id, "data:", data);

    // Get a valid user ID directly
    const userId = await getCurrentUserId();
    console.log("User ID from getCurrentUserId:", userId);

    // Create project data with the valid user ID
    const projectData = {
      name: data.name,
      description: data.description,
      color: data.color,
    };
    console.log("Project data to update:", projectData);

    // Update the project
    await db
      .update(schema.projects)
      .set(projectData)
      .where(
        and(eq(schema.projects.id, id), eq(schema.projects.user_id, userId))
      );
    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error("Error editing project:", error);
    throw error;
  }
}

export async function deleteProject(id: number) {
  try {
    // Get the current user ID to ensure the user is authenticated
    await getCurrentUserId();

    // Soft delete the project
    await softDeleteProject(id);
    revalidatePath("/");
  } catch (error) {
    console.error("Error deleting project:", error);
    throw error;
  }
}

export async function addActivity(data: ActivityFormValues) {
  try {
    console.log("addActivity called with data:", data);

    // Get a valid user ID directly
    const userId = await getCurrentUserId();
    console.log("User ID from getCurrentUserId:", userId);

    // Create activity data with the valid user ID
    const activityData = {
      name: data.name,
      user_id: userId,
    };
    console.log("Activity data to insert:", activityData);

    // Insert the activity
    await db.insert(schema.activities).values(activityData);
    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error("Error adding activity:", error);
    throw error;
  }
}

export async function editActivity(id: number, data: ActivityFormValues) {
  try {
    console.log("editActivity called with id:", id, "data:", data);

    // Get a valid user ID directly
    const userId = await getCurrentUserId();
    console.log("User ID from getCurrentUserId:", userId);

    // Create activity data with the valid user ID
    const activityData = {
      name: data.name,
    };
    console.log("Activity data to update:", activityData);

    // Update the activity
    await db
      .update(schema.activities)
      .set(activityData)
      .where(
        and(eq(schema.activities.id, id), eq(schema.activities.user_id, userId))
      );
    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error("Error editing activity:", error);
    throw error;
  }
}

export async function deleteActivity(id: number) {
  try {
    // Get the current user ID to ensure the user is authenticated
    await getCurrentUserId();

    // Soft delete the activity
    await softDeleteActivity(id);
    revalidatePath("/");
  } catch (error) {
    console.error("Error deleting activity:", error);
    throw error;
  }
}

export async function editTask(id: number, data: TaskFormValues) {
  try {
    console.log("editTask called with id:", id, "data:", data);

    // Get a valid user ID directly
    const userId = await getCurrentUserId();
    console.log("User ID from getCurrentUserId:", userId);

    // Create task data with the valid user ID
    const taskData = {
      name: data.name,
      project_id: parseInt(data.project_id),
      activity_id: parseInt(data.activity_id),
    };
    console.log("Task data to update:", taskData);

    // Update the task
    await db
      .update(schema.tasks)
      .set(taskData)
      .where(and(eq(schema.tasks.id, id), eq(schema.tasks.user_id, userId)));
    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error("Error editing task:", error);
    throw error;
  }
}

export async function addTask(data: TaskFormValues) {
  try {
    console.log("addTask called with data:", data);

    // Get a valid user ID directly
    const userId = await getCurrentUserId();
    console.log("User ID from getCurrentUserId:", userId);

    // Create task data with the valid user ID
    const taskData = {
      name: data.name,
      project_id: parseInt(data.project_id),
      activity_id: parseInt(data.activity_id),
      user_id: userId,
    };
    console.log("Task data to insert:", taskData);

    // Insert the task
    await db.insert(schema.tasks).values(taskData);
    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error("Error adding task:", error);
    throw error;
  }
}

export async function deleteTask(id: number) {
  try {
    // Get the current user ID to ensure the user is authenticated
    await getCurrentUserId();

    // Soft delete the task
    await softDeleteTask(id);
    revalidatePath("/");
  } catch (error) {
    console.error("Error deleting task:", error);
    throw error;
  }
}
