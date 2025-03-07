"use client";

import { useState } from "react";
import Header from "@/components/Header";
import TaskTracker from "@/components/TaskTracker";
import { ProjectFormValues, ActivityFormValues } from "@/lib/schemas";
import { startOfDay } from "date-fns";
import {
  addActivity,
  addProject,
  editActivity,
  editProject,
} from "@/lib/actions";
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

interface DbActivity {
  id: number;
  name: string;
  createdAt: Date | number;
}

interface HomeClientProps {
  initialTasks: DbTask[];
  initialProjects: DbProject[];
  initialTaskRecords: DbTaskRecord[];
  initialActiveTask: DbTask | null;
  initialActivities: DbActivity[];
}

export default function HomeClient({
  initialTasks,
  initialProjects,
  initialTaskRecords,
  initialActiveTask,
  initialActivities,
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

  // Convert activities to the correct type
  const formattedActivities =
    initialActivities?.map((activity) => ({
      id: activity.id,
      name: activity.name,
    })) || [];

  // Handle date change
  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  // These functions would normally interact with your backend
  const handleAddProject = async (data: ProjectFormValues) => {
    await addProject(data);
  };

  const handleEditProject = async (
    projectId: number,
    data: ProjectFormValues
  ) => {
    await editProject(projectId, data);
  };

  const handleAddActivity = async (data: ActivityFormValues) => {
    await addActivity(data);
  };

  const handleEditActivity = async (
    activityId: number,
    data: ActivityFormValues
  ) => {
    await editActivity(activityId, data);
  };

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <Header
        projects={formattedProjects}
        activities={formattedActivities}
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
          initialActivities={formattedActivities}
          selectedDate={selectedDate}
        />
      </div>
    </main>
  );
}
