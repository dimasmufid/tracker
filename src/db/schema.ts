import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { sql } from "drizzle-orm";

// Create a client with fallback for different environments
const createDbClient = () => {
  // Check if we're in a production environment (Vercel)
  const isProduction = process.env.VERCEL === "1";

  try {
    // In production, always use HTTP mode to avoid native module issues
    if (isProduction) {
      const dbUrl = process.env.TURSO_DATABASE_URL!;
      const httpUrl = dbUrl.startsWith("libsql://")
        ? dbUrl.replace("libsql://", "https://")
        : dbUrl;

      console.log("Using HTTP mode for database connection in production");
      return createClient({
        url: dbUrl,
        authToken: process.env.TURSO_AUTH_TOKEN!,
        syncUrl: httpUrl,
      });
    }

    // In development, try to use native client
    console.log("Using native mode for database connection in development");
    return createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    });
  } catch (e) {
    console.error("Error creating libsql client:", e);
    // Fallback for any environment where client creation fails
    const dbUrl = process.env.TURSO_DATABASE_URL!;
    const httpUrl = dbUrl.startsWith("libsql://")
      ? dbUrl.replace("libsql://", "https://")
      : dbUrl;

    console.log("Falling back to HTTP mode for database connection");
    return createClient({
      url: dbUrl,
      authToken: process.env.TURSO_AUTH_TOKEN!,
      syncUrl: httpUrl,
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
