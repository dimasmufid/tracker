ALTER TABLE "activities" RENAME COLUMN "userId" TO "user_id";--> statement-breakpoint
ALTER TABLE "projects" RENAME COLUMN "userId" TO "user_id";--> statement-breakpoint
ALTER TABLE "task_records" RENAME COLUMN "userId" TO "user_id";--> statement-breakpoint
ALTER TABLE "tasks" RENAME COLUMN "userId" TO "user_id";--> statement-breakpoint
ALTER TABLE "activities" DROP CONSTRAINT "activities_userId_user_id_fk";
--> statement-breakpoint
ALTER TABLE "projects" DROP CONSTRAINT "projects_userId_user_id_fk";
--> statement-breakpoint
ALTER TABLE "task_records" DROP CONSTRAINT "task_records_userId_user_id_fk";
--> statement-breakpoint
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_userId_user_id_fk";
--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "is_deleted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "is_deleted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "task_records" ADD COLUMN "is_deleted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "is_deleted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_records" ADD CONSTRAINT "task_records_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;