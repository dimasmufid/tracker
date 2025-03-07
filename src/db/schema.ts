import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { sql } from "drizzle-orm";

// Create a client with fallback for different environments
const createDbClient = () => {
  try {
    return createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    });
  } catch (e) {
    console.error("Error creating libsql client:", e);
    // Fallback for environments where native modules might not be available
    return createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
      // Force HTTP protocol if native client fails
      syncUrl: process.env.TURSO_DATABASE_URL!.replace("libsql://", "https://"),
    });
  }
};

const client = createDbClient();
export const db = drizzle(client);

export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  color: text("color").notNull().default("#FFFFFF"),
});

export const activities = sqliteTable("activities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const tasks = sqliteTable("tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  projectId: integer("projectId")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  activityId: integer("activityId")
    .notNull()
    .references(() => activities.id, { onDelete: "cascade" }),
  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const taskRecords = sqliteTable("taskRecords", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  taskId: integer("taskId")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  startedAt: integer("startedAt", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  endedAt: integer("endedAt", { mode: "timestamp_ms" }),
});
