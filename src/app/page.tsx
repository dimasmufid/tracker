import Header from "@/components/Header";
import TaskTracker from "@/components/TaskTracker";
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

  // Log the first task record for debugging
  if (taskRecords.length > 0) {
    console.log("First task record from database:", {
      id: taskRecords[0].id,
      taskId: taskRecords[0].taskId,
      startedAt: taskRecords[0].startedAt,
      endedAt: taskRecords[0].endedAt,
    });
  }

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <Header />
      <div className="flex-grow container mx-auto px-0 md:px-2 max-w-7xl">
        <TaskTracker
          initialTasks={tasks}
          initialProjects={projects}
          initialTaskRecords={taskRecords}
          initialActiveTask={activeTask}
        />
      </div>
    </main>
  );
}
