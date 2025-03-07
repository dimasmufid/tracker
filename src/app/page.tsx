import Header from "@/components/Header";
import TaskTracker from "@/components/TaskTracker";
import {
  getTasks,
  getProjects,
  getTaskRecords,
  getActiveTask,
} from "@/services/taskService";
import { ProjectFormValues, ActivityFormValues } from "@/lib/schemas";

// Type definitions
type Project = {
  id: number;
  name: string;
  description?: string;
  color: string;
  createdAt: number;
};

export default async function Home() {
  console.log("Fetching data for home page...");

  const tasks = await getTasks();
  const projects = await getProjects();
  const taskRecords = await getTaskRecords();
  const activeTask = await getActiveTask();

  // Convert projects to the correct type
  const formattedProjects: Project[] = projects.map((project) => ({
    id: project.id,
    name: project.name,
    description: project.description || undefined,
    color: project.color,
    createdAt:
      project.createdAt instanceof Date
        ? project.createdAt.getTime()
        : Number(project.createdAt),
  }));

  // Mock activities for demo
  const activities = [
    { id: 1, name: "Development" },
    { id: 2, name: "Design" },
    { id: 3, name: "Meeting" },
    { id: 4, name: "Planning" },
    { id: 5, name: "Research" },
  ];

  // Log the first task record for debugging
  if (taskRecords.length > 0) {
    console.log("First task record from database:", {
      id: taskRecords[0].id,
      taskId: taskRecords[0].taskId,
      startedAt: taskRecords[0].startedAt,
      endedAt: taskRecords[0].endedAt,
    });
  }

  // These functions would normally interact with your backend
  // For now, they're just placeholders that will be handled client-side
  const handleAddProject = async (data: ProjectFormValues) => {
    "use server";
    console.log("Adding project:", data);
    // Implementation would go here
  };

  const handleEditProject = async (
    projectId: number,
    data: ProjectFormValues
  ) => {
    "use server";
    console.log("Editing project:", projectId, data);
    // Implementation would go here
  };

  const handleAddActivity = async (data: ActivityFormValues) => {
    "use server";
    console.log("Adding activity:", data);
    // Implementation would go here
  };

  const handleEditActivity = async (
    activityId: number,
    data: ActivityFormValues
  ) => {
    "use server";
    console.log("Editing activity:", activityId, data);
    // Implementation would go here
  };

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <Header
        projects={formattedProjects}
        activities={activities}
        onAddProject={handleAddProject}
        onEditProject={handleEditProject}
        onAddActivity={handleAddActivity}
        onEditActivity={handleEditActivity}
      />
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
