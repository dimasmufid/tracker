"use client";

import { useState, useEffect } from "react";
import Stopwatch from "./Stopwatch";
import TaskList from "./TaskList";
import { startTaskTracking, stopTaskTracking } from "@/services/taskService";
import { normalizeTimestamp } from "@/utils/timeUtils";

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

// Define normalized types for client-side use
interface Task {
  id: number;
  name: string;
  projectId: number;
  activityId: number;
  createdAt: number;
}

interface Project {
  id: number;
  name: string;
  description?: string;
  color: string;
  createdAt: number;
}

interface TaskRecord {
  id: number;
  taskId: number;
  startedAt: number;
  endedAt: number | null;
}

interface TaskTrackerProps {
  initialTasks: DbTask[];
  initialProjects: DbProject[];
  initialTaskRecords: DbTaskRecord[];
  initialActiveTask: DbTask | null;
}

export default function TaskTracker({
  initialTasks,
  initialProjects,
  initialTaskRecords,
  initialActiveTask,
}: TaskTrackerProps) {
  // Convert all dates to timestamps for client-side use
  const [tasks] = useState<Task[]>(() =>
    initialTasks.map((task) => ({
      ...task,
      createdAt: normalizeTimestamp(task.createdAt) || Date.now(),
    }))
  );

  const [projects] = useState<Project[]>(() =>
    initialProjects.map((project) => ({
      ...project,
      description: project.description || undefined,
      createdAt: normalizeTimestamp(project.createdAt) || Date.now(),
    }))
  );

  const [taskRecords, setTaskRecords] = useState<TaskRecord[]>(() =>
    initialTaskRecords.map((record) => ({
      ...record,
      startedAt: normalizeTimestamp(record.startedAt) || Date.now(),
      endedAt: normalizeTimestamp(record.endedAt),
    }))
  );

  const [activeTask, setActiveTask] = useState<Task | null>(() =>
    initialActiveTask
      ? {
          ...initialActiveTask,
          createdAt:
            normalizeTimestamp(initialActiveTask.createdAt) || Date.now(),
        }
      : null
  );

  const [activeTaskId, setActiveTaskId] = useState<number | null>(
    initialActiveTask?.id || null
  );

  // Debug logging
  useEffect(() => {
    if (taskRecords.length > 0) {
      console.log("First task record after normalization:", taskRecords[0]);
    }
  }, [taskRecords]);

  // Handle task selection
  const handleSelectTask = (taskId: number) => {
    const selectedTask = tasks.find((task) => task.id === taskId);
    if (selectedTask) {
      setActiveTask(selectedTask);
      setActiveTaskId(taskId);
    }
  };

  // Start tracking a task
  const handleStartTracking = async (taskId: number) => {
    try {
      const result = await startTaskTracking(taskId);
      if (result && result.length > 0) {
        // Add the new record to the list
        const newRecord: TaskRecord = {
          ...result[0],
          startedAt: normalizeTimestamp(result[0].startedAt) || Date.now(),
          endedAt: normalizeTimestamp(result[0].endedAt),
        };
        console.log("New record created:", newRecord);
        setTaskRecords((prev) => [newRecord, ...prev]);
        return Promise.resolve();
      }
    } catch (error) {
      console.error("Failed to start tracking:", error);
    }
    return Promise.reject();
  };

  // Stop tracking a task
  const handleStopTracking = async (taskId: number) => {
    try {
      const result = await stopTaskTracking(taskId);
      if (result && result.length > 0) {
        // Update the record in the list
        const updatedRecord: TaskRecord = {
          ...result[0],
          startedAt: normalizeTimestamp(result[0].startedAt) || Date.now(),
          endedAt: normalizeTimestamp(result[0].endedAt),
        };
        console.log("Record updated:", updatedRecord);
        setTaskRecords((prev) =>
          prev.map((record) =>
            record.id === updatedRecord.id ? updatedRecord : record
          )
        );
        return Promise.resolve();
      }
    } catch (error) {
      console.error("Failed to stop tracking:", error);
    }
    return Promise.reject();
  };

  return (
    <div className="flex flex-col md:flex-row grow bg-background">
      <div className="w-full md:w-1/2 p-2 md:p-4 flex">
        <div className="w-full max-w-2xl mx-auto">
          <Stopwatch
            activeTask={activeTask}
            onStartTracking={handleStartTracking}
            onStopTracking={handleStopTracking}
            taskRecords={taskRecords}
          />
        </div>
      </div>
      <div className="w-full md:w-1/2 p-2 md:p-4 bg-card">
        <div className="w-full max-w-2xl mx-auto">
          <TaskList
            tasks={tasks}
            projects={projects}
            activeTaskId={activeTaskId}
            onSelectTask={handleSelectTask}
          />
        </div>
      </div>
    </div>
  );
}
