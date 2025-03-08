import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  primaryKey,
} from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { type AdapterAccount } from "@auth/core/adapters";

// Configure Neon to use WebSockets in Node.js environment
neonConfig.webSocketConstructor = ws;

// Check for DATABASE_URL environment variable
if (!process.env.DATABASE_URL) {
  console.warn("Warning: DATABASE_URL environment variable is not set");
}

// Create a Neon database client with connection pooling
const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
});
export const db = drizzle(pool);

// Auth.js schema
export const users = pgTable("user", {
  id: text("id").notNull().primaryKey(),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  password: text("password"),
  image: text("image"),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccount["type"]>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").notNull().primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  color: text("color").notNull().default("#FFFFFF"),
  userId: text("userId").references(() => users.id, { onDelete: "cascade" }),
});

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  userId: text("userId").references(() => users.id, { onDelete: "cascade" }),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  activityId: integer("activity_id")
    .notNull()
    .references(() => activities.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  userId: text("userId").references(() => users.id, { onDelete: "cascade" }),
});

export const taskRecords = pgTable("task_records", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  endedAt: timestamp("ended_at"),
  userId: text("userId").references(() => users.id, { onDelete: "cascade" }),
});
