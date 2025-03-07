import HomeClient from "./client-page";
import {
  getTasks,
  getProjects,
  getTaskRecords,
  getActiveTask,
  getActivities,
} from "@/services/taskService";

export default async function Home() {
  const tasks = await getTasks();
  const projects = await getProjects();
  const activities = await getActivities();
  const taskRecords = await getTaskRecords();
  const activeTask = await getActiveTask();

  return (
    <HomeClient
      initialTasks={tasks}
      initialProjects={projects}
      initialTaskRecords={taskRecords}
      initialActiveTask={activeTask}
      initialActivities={activities}
    />
  );
}
