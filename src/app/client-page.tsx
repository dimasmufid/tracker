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
import { toast } from "@/components/ui/use-toast";

// Type definitions
type Project = {
  id: number;
  name: string;
  description?: string;
  color: string;
  created_at: number;
};

type Activity = {
  id: number;
  name: string;
};

// Define types that match the database schema
interface DbTask {
  id: number;
  name: string;
  project_id: number;
  activity_id: number;
  created_at: Date | number;
}

interface DbProject {
  id: number;
  name: string;
  description: string | null;
  color: string;
  created_at: Date | number;
}

interface DbTaskRecord {
  id: number;
  task_id: number;
  started_at: Date | number;
  ended_at: Date | number | null;
}

interface DbActivity {
  id: number;
  name: string;
  created_at: Date | number;
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

  // Convert and maintain projects state
  const [projects, setProjects] = useState<Project[]>(() =>
    initialProjects.map((project) => ({
      id: project.id,
      name: project.name,
      description: project.description || undefined,
      color: project.color,
      created_at:
        project.created_at instanceof Date
          ? project.created_at.getTime()
          : Number(project.created_at),
    }))
  );

  // Convert and maintain activities state
  const [activities, setActivities] = useState<Activity[]>(
    () =>
      initialActivities?.map((activity) => ({
        id: activity.id,
        name: activity.name,
      })) || []
  );

  // Handle date change
  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  // These functions would normally interact with your backend
  const handleAddProject = async (data: ProjectFormValues) => {
    try {
      console.log("handleAddProject called with data:", data);
      const response = await addProject(data);

      if (response.project) {
        // Use the actual project data from the server response
        const newProject: Project = {
          id: response.project.id,
          name: response.project.name,
          description: response.project.description || undefined,
          color: response.project.color,
          created_at:
            response.project.created_at instanceof Date
              ? response.project.created_at.getTime()
              : Number(response.project.created_at),
        };
        setProjects((prev) => [...prev, newProject]);

        toast({
          title: "Project created",
          description: "Your project has been created successfully.",
        });
      }
    } catch (error) {
      console.error("Failed to add project:", error);
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditProject = async (
    projectId: number,
    data: ProjectFormValues
  ) => {
    try {
      await editProject(projectId, data);
      // Update the project in the local state
      setProjects((prev) =>
        prev.map((project) =>
          project.id === projectId
            ? {
                ...project,
                name: data.name,
                description: data.description,
                color: data.color,
              }
            : project
        )
      );
      console.log("Project updated in client state:", projectId, data);
    } catch (error) {
      console.error("Failed to edit project:", error);
    }
  };

  const handleAddActivity = async (data: ActivityFormValues) => {
    try {
      await addActivity(data);
      // Optimistically update the UI
      const newActivity: Activity = {
        id: Math.floor(Math.random() * 1000) + 100, // Temporary ID
        name: data.name,
      };
      setActivities((prev) => [...prev, newActivity]);
    } catch (error) {
      console.error("Failed to add activity:", error);
    }
  };

  const handleEditActivity = async (
    activityId: number,
    data: ActivityFormValues
  ) => {
    try {
      await editActivity(activityId, data);
      // Update the activity in the local state
      setActivities((prev) =>
        prev.map((activity) =>
          activity.id === activityId
            ? {
                ...activity,
                name: data.name,
              }
            : activity
        )
      );
    } catch (error) {
      console.error("Failed to edit activity:", error);
    }
  };

  // Handle project deletion
  const handleProjectDeleted = async (projectId: number) => {
    try {
      // Remove the project from the local state
      setProjects((prev) => prev.filter((project) => project.id !== projectId));

      toast({
        title: "Project deleted",
        description: "The project has been deleted successfully.",
      });
    } catch (error) {
      console.error("Failed to delete project:", error);
      toast({
        title: "Error",
        description: "Failed to delete project. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle activity deletion
  const handleActivityDeleted = async (activityId: number) => {
    try {
      // Remove the activity from the local state
      setActivities((prev) =>
        prev.filter((activity) => activity.id !== activityId)
      );

      toast({
        title: "Activity deleted",
        description: "The activity has been deleted successfully.",
      });
    } catch (error) {
      console.error("Failed to delete activity:", error);
      toast({
        title: "Error",
        description: "Failed to delete activity. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <Header
        projects={projects}
        activities={activities}
        onAddProject={handleAddProject}
        onEditProject={handleEditProject}
        onAddActivity={handleAddActivity}
        onEditActivity={handleEditActivity}
        onDateChange={handleDateChange}
        selectedDate={selectedDate}
        onProjectDeleted={handleProjectDeleted}
        onActivityDeleted={handleActivityDeleted}
      />
      <div className="flex-grow container mx-auto px-0 md:px-2 max-w-7xl">
        <TaskTracker
          initialTasks={initialTasks}
          initialProjects={initialProjects}
          initialTaskRecords={initialTaskRecords}
          initialActiveTask={initialActiveTask}
          initialActivities={initialActivities}
          selectedDate={selectedDate}
          currentProjects={projects} // Pass the current projects state
        />
      </div>
    </main>
  );
}
