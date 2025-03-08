import HomeClient from "./client-page";
import {
  getTasks,
  getProjects,
  getTaskRecords,
  getActiveTask,
  getActivities,
} from "@/services/taskService";

export default async function Home() {
  try {
    // Get all data from the database
    let tasks = await getTasks();
    let projects = await getProjects();
    const activities = await getActivities();
    const taskRecords = await getTaskRecords();

    // Get the active task, but handle potential errors
    let activeTask = null;
    try {
      activeTask = await getActiveTask();
    } catch (error) {
      console.error("Error getting active task:", error);
      // Continue with null activeTask
    }

    // If we have an active task, sort tasks to put the active one first
    if (activeTask) {
      // Sort tasks to put the active one first
      tasks = [
        ...tasks.filter((task) => task.id === activeTask.id),
        ...tasks.filter((task) => task.id !== activeTask.id),
      ];

      // Find the active project (the project of the active task)
      const activeProjectId = activeTask.projectId;

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
