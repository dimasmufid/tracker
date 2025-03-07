"use server";

import { db } from "@/db/schema";
import * as schema from "@/db/schema";
import { revalidatePath } from "next/cache";
import { ActivityFormValues, ProjectFormValues } from "./schemas";
import { eq } from "drizzle-orm";

export async function addProject(data: ProjectFormValues) {
  await db.insert(schema.projects).values(data);
  revalidatePath("/");
}

export async function editProject(id: number, data: ProjectFormValues) {
  await db.update(schema.projects).set(data).where(eq(schema.projects.id, id));
  revalidatePath("/");
}

export async function deleteProject(id: number) {
  await db.delete(schema.projects).where(eq(schema.projects.id, id));
  revalidatePath("/");
}

export async function addActivity(data: ActivityFormValues) {
  await db.insert(schema.activities).values(data);
  revalidatePath("/");
}

export async function editActivity(id: number, data: ActivityFormValues) {
  await db
    .update(schema.activities)
    .set(data)
    .where(eq(schema.activities.id, id));
  revalidatePath("/");
}

export async function deleteActivity(id: number) {
  await db.delete(schema.activities).where(eq(schema.activities.id, id));
  revalidatePath("/");
}
