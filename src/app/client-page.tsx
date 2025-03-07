"use client";

import { useState } from "react";
import Header from "@/components/Header";
import TaskTracker from "@/components/TaskTracker";
import { ProjectFormValues, ActivityFormValues } from "@/lib/schemas";
import { startOfDay } from "date-fns";

// Type definitions
type Project = {
  id: number;
  name: string;
  description?: string;
  color: string;
  createdAt: number;
};

// Define types that match the database schema
interface DbTask {
  id: number;
  name: string;
  projectId: number;
  activityId: number;
  createdAt: Date | number;
}

interface DbProject {
  id: number;
  name: string;
  description: string | null;
  color: string;
  createdAt: Date | number;
}

interface DbTaskRecord {
  id: number;
  taskId: number;
  startedAt: Date | number;
  endedAt: Date | number | null;
}

interface HomeClientProps {
  initialTasks: DbTask[];
  initialProjects: DbProject[];
  initialTaskRecords: DbTaskRecord[];
  initialActiveTask: DbTask | null;
}

export default function HomeClient({
  initialTasks,
  initialProjects,
  initialTaskRecords,
  initialActiveTask,
}: HomeClientProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(
    startOfDay(new Date())
  );

  // Convert projects to the correct type
  const formattedProjects: Project[] = initialProjects.map((project) => ({
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

  // Handle date change
  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  // These functions would normally interact with your backend
  const handleAddProject = async (data: ProjectFormValues) => {
    console.log("Adding project:", data);
    // Implementation would go here
    return Promise.resolve();
  };

  const handleEditProject = async (
    projectId: number,
    data: ProjectFormValues
  ) => {
    console.log("Editing project:", projectId, data);
    // Implementation would go here
    return Promise.resolve();
  };

  const handleAddActivity = async (data: ActivityFormValues) => {
    console.log("Adding activity:", data);
    // Implementation would go here
    return Promise.resolve();
  };

  const handleEditActivity = async (
    activityId: number,
    data: ActivityFormValues
  ) => {
    console.log("Editing activity:", activityId, data);
    // Implementation would go here
    return Promise.resolve();
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
        onDateChange={handleDateChange}
        selectedDate={selectedDate}
      />
      <div className="flex-grow container mx-auto px-0 md:px-2 max-w-7xl">
        <TaskTracker
          initialTasks={initialTasks}
          initialProjects={initialProjects}
          initialTaskRecords={initialTaskRecords}
          initialActiveTask={initialActiveTask}
          selectedDate={selectedDate}
        />
      </div>
    </main>
  );
}
