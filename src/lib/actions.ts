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
import { auth } from "@/auth";

// Helper function to validate user_id
async function validateUserId(providedUserId: string): Promise<string> {
  const session = await auth();
  const authenticatedUserId = session?.user?.id;

  if (!authenticatedUserId) {
    throw new Error("User not authenticated");
  }

  // Ensure the provided user_id matches the authenticated user
  if (providedUserId !== authenticatedUserId) {
    throw new Error("Unauthorized: User ID mismatch");
  }

  return authenticatedUserId;
}

export async function addProject(data: ProjectFormValues) {
  // Validate the user_id
  await validateUserId(data.user_id);

  // Insert the project with the validated user_id
  await db.insert(schema.projects).values(data);
  revalidatePath("/");
}

export async function editProject(id: number, data: ProjectFormValues) {
  // Validate the user_id
  await validateUserId(data.user_id);

  // Update the project, ensuring it belongs to the user
  await db
    .update(schema.projects)
    .set(data)
    .where(
      and(eq(schema.projects.id, id), eq(schema.projects.user_id, data.user_id))
    );
  revalidatePath("/");
}

export async function deleteProject(id: number) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    throw new Error("User not authenticated");
  }

  // Delete the project, ensuring it belongs to the user
  await db
    .delete(schema.projects)
    .where(
      and(eq(schema.projects.id, id), eq(schema.projects.user_id, userId))
    );
  revalidatePath("/");
}

export async function addActivity(data: ActivityFormValues) {
  // Validate the user_id
  await validateUserId(data.user_id);

  // Insert the activity with the validated user_id
  await db.insert(schema.activities).values(data);
  revalidatePath("/");
}

export async function editActivity(id: number, data: ActivityFormValues) {
  // Validate the user_id
  await validateUserId(data.user_id);

  // Update the activity, ensuring it belongs to the user
  await db
    .update(schema.activities)
    .set(data)
    .where(
      and(
        eq(schema.activities.id, id),
        eq(schema.activities.user_id, data.user_id)
      )
    );
  revalidatePath("/");
}

export async function deleteActivity(id: number) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    throw new Error("User not authenticated");
  }

  // Delete the activity, ensuring it belongs to the user
  await db
    .delete(schema.activities)
    .where(
      and(eq(schema.activities.id, id), eq(schema.activities.user_id, userId))
    );
  revalidatePath("/");
}

export async function editTask(id: number, data: TaskFormValues) {
  // Validate the user_id
  await validateUserId(data.user_id);

  // Update the task, ensuring it belongs to the user
  await db
    .update(schema.tasks)
    .set({
      name: data.name,
      project_id: parseInt(data.project_id),
      activity_id: parseInt(data.activity_id),
      // We don't update user_id as it should remain the same
    })
    .where(
      and(eq(schema.tasks.id, id), eq(schema.tasks.user_id, data.user_id))
    );
  revalidatePath("/");
}

export async function addTask(data: TaskFormValues) {
  // Validate the user_id
  await validateUserId(data.user_id);

  // Insert the task with the validated user_id
  await db.insert(schema.tasks).values({
    name: data.name,
    project_id: parseInt(data.project_id),
    activity_id: parseInt(data.activity_id),
    user_id: data.user_id,
  });
  revalidatePath("/");
}

export async function deleteTask(id: number) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    throw new Error("User not authenticated");
  }

  // Delete the task, ensuring it belongs to the user
  await db
    .delete(schema.tasks)
    .where(and(eq(schema.tasks.id, id), eq(schema.tasks.user_id, userId)));
  revalidatePath("/");
}
