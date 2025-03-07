import HomeClient from "./client-page";
import {
  getTasks,
  getProjects,
  getTaskRecords,
  getActiveTask,
} from "@/services/taskService";

export default async function Home() {
  console.log("Fetching data for home page...");

  const tasks = await getTasks();
  const projects = await getProjects();
  const taskRecords = await getTaskRecords();
  const activeTask = await getActiveTask();

  return (
    <HomeClient
      initialTasks={tasks}
      initialProjects={projects}
      initialTaskRecords={taskRecords}
      initialActiveTask={activeTask}
    />
  );
}
