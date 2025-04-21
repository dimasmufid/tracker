import HomeClient from "./client-page";
import {
  getTasks,
  getProjects,
  getTaskRecords,
  getActiveTask,
  getActivities,
} from "@/services/taskService";
import { tasks } from "@/db/schema";
import { InferSelectModel } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

// Define the Task type based on the database schema
type Task = InferSelectModel<typeof tasks>;

export default async function Home() {
  // Check if the user is authenticated
  const session = await auth();
  if (!session?.user) {
    // Redirect to sign-in page if not authenticated
    redirect("/sign-in");
  }

  try {
    // Get all data from the database
    const allTasks = await getTasks();
    let projects = await getProjects();
    const activities = await getActivities();
    const taskRecords = await getTaskRecords();

    // Filter out tasks that are already marked as done
    let tasks = allTasks.filter((task) => !task.is_done);

    // Get the active task, but handle potential errors
    let activeTask: Task | null = null;
    try {
      // First check if there's an active record in the database
      const activeRecords = taskRecords.filter(
        (record) => record.ended_at === null
      );

      if (activeRecords.length > 0) {
        // If there are multiple active records, use the most recent one
        const mostRecentRecord = activeRecords.sort((a, b) => {
          const aTime =
            a.started_at instanceof Date
              ? a.started_at.getTime()
              : Number(a.started_at);
          const bTime =
            b.started_at instanceof Date
              ? b.started_at.getTime()
              : Number(b.started_at);
          return bTime - aTime;
        })[0];

        // Find the task associated with this record
        const taskForRecord = tasks.find(
          (task) => task.id === mostRecentRecord.task_id
        );

        if (taskForRecord) {
          activeTask = taskForRecord;
          console.log(
            "Active task determined from active record:",
            activeTask.id
          );
        } else {
          console.warn(
            "Found active record but no matching task, will try getActiveTask()"
          );
          activeTask = await getActiveTask();
        }
      } else {
        // No active records found, use the getActiveTask function as fallback
        activeTask = await getActiveTask();
        console.log(
          "No active records found, using getActiveTask result:",
          activeTask?.id
        );
      }
    } catch (error) {
      console.error("Error getting active task:", error);
      // Continue with null activeTask
    }

    // If we have an active task, sort tasks to put the active one first
    if (activeTask) {
      // Sort tasks to put the active one first
      tasks = [
        ...tasks.filter((task) => task.id === activeTask!.id),
        ...tasks.filter((task) => task.id !== activeTask!.id),
      ];

      // Find the active project (the project of the active task)
      const activeProjectId = activeTask.project_id;

      // Sort projects to put the active one first
      projects = [
        ...projects.filter((project) => project.id === activeProjectId),
        ...projects.filter((project) => project.id !== activeProjectId),
      ];

      console.log("Sorted active task and project to the top:", {
        activeTaskId: activeTask.id,
        activeProjectId,
      });
    }

    return (
      <HomeClient
        initialTasks={tasks}
        initialProjects={projects}
        initialTaskRecords={taskRecords}
        initialActiveTask={activeTask}
        initialActivities={activities}
      />
    );
  } catch (error) {
    console.error("Error loading initial data:", error);
    // Return a simple error UI
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
        <p className="text-muted-foreground">Please try refreshing the page</p>
      </div>
    );
  }
}
