import { z } from "zod";

// Project schema
export const projectFormSchema = z.object({
  name: z
    .string()
    .min(2, {
      message: "Project name must be at least 2 characters.",
    })
    .max(50, {
      message: "Project name must not exceed 50 characters.",
    }),
  description: z.string().optional(),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: "Please enter a valid hex color code (e.g., #FF5733).",
  }),
});

export type ProjectFormValues = z.infer<typeof projectFormSchema>;

// Activity schema
export const activityFormSchema = z.object({
  name: z
    .string()
    .min(2, {
      message: "Activity name must be at least 2 characters.",
    })
    .max(50, {
      message: "Activity name must not exceed 50 characters.",
    }),
});

export type ActivityFormValues = z.infer<typeof activityFormSchema>;

// Task schema
export const taskFormSchema = z.object({
  name: z
    .string()
    .min(2, {
      message: "Task name must be at least 2 characters.",
    })
    .max(50, {
      message: "Task name must not exceed 50 characters.",
    }),
  project_id: z.string({
    required_error: "Please select a project.",
  }),
  activity_id: z.string({
    required_error: "Please select an activity.",
  }),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;
