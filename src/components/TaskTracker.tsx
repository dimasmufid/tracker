"use client";

import { useState, useEffect, useMemo } from "react";
import Stopwatch from "./Stopwatch";
import TaskList from "./TaskList";
import { AddTaskDialog } from "./AddTaskDialog";
import { EditTaskDialog } from "./EditTaskDialog";
import {
  startTaskTracking,
  stopTaskTracking,
  createTask,
  checkTaskExists,
} from "@/services/taskService";
import { normalizeTimestamp } from "@/utils/timeUtils";
import * as z from "zod";
import { startOfDay } from "date-fns";
import { toast } from "@/components/ui/use-toast";

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

interface DbActivity {
  id: number;
  name: string;
}

interface TaskTrackerProps {
  initialTasks: DbTask[];
  initialProjects: DbProject[];
  initialTaskRecords: DbTaskRecord[];
  initialActiveTask: DbTask | null;
  initialActivities: DbActivity[];
  selectedDate?: Date;
}

// Form schema for adding a task
const taskFormSchema = z.object({
  name: z.string().min(2).max(50),
  projectId: z.string(),
  activityId: z.string(),
});

export default function TaskTracker({
  initialTasks,
  initialProjects,
  initialTaskRecords,
  initialActiveTask,
  initialActivities,
  selectedDate,
}: TaskTrackerProps) {
  // Convert all dates to timestamps for client-side use
  const [tasks, setTasks] = useState<Task[]>(() =>
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

  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  const [isEditTaskDialogOpen, setIsEditTaskDialogOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  // Debug logging
  useEffect(() => {
    if (taskRecords.length > 0) {
      console.log("First task record after normalization:", taskRecords[0]);
    }
  }, [taskRecords]);

  // Filter tasks based on the selected date
  const filteredTasks = useMemo(() => {
    if (!selectedDate) return tasks;

    const startOfSelectedDay = startOfDay(selectedDate).getTime();
    const endOfSelectedDay = startOfSelectedDay + 24 * 60 * 60 * 1000 - 1;

    return tasks.filter((task) => {
      const taskCreatedAt = task.createdAt;
      return (
        taskCreatedAt >= startOfSelectedDay && taskCreatedAt <= endOfSelectedDay
      );
    });
  }, [tasks, selectedDate]);

  // Handle task selection
  const handleSelectTask = async (taskId: number) => {
    const selectedTask = tasks.find((task) => task.id === taskId);
    if (selectedTask) {
      // Check if the task exists in the database
      const exists = await checkTaskExists(taskId);
      if (exists) {
        setActiveTask(selectedTask);
        setActiveTaskId(taskId);
      } else {
        toast({
          title: "Task not found",
          description: `Task #${taskId} does not exist in the database. It may have been deleted.`,
          variant: "destructive",
        });
        console.error(`Task #${taskId} does not exist in the database`);
      }
    }
  };

  // Clear active task
  const handleClearActiveTask = () => {
    setActiveTask(null);
    setActiveTaskId(null);
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
      } else {
        console.error("No record was created when starting tracking");
        return Promise.reject(new Error("Failed to create tracking record"));
      }
    } catch (error) {
      console.error("Failed to start tracking:", error);
      return Promise.reject(error);
    }
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
      } else {
        console.error("No active tracking session found for task ID:", taskId);
        return Promise.reject(new Error("No active tracking session found"));
      }
    } catch (error) {
      console.error("Failed to stop tracking:", error);
      return Promise.reject(error);
    }
  };

  // Handle adding a new task
  const handleAddTask = async (data: z.infer<typeof taskFormSchema>) => {
    try {
      // Validate the data using the schema
      taskFormSchema.parse(data);

      // Create the task in the database
      const newTaskData = await createTask(
        data.name,
        parseInt(data.projectId),
        parseInt(data.activityId)
      );

      // Convert the returned task to the client-side format
      const newTask: Task = {
        ...newTaskData,
        createdAt: normalizeTimestamp(newTaskData.createdAt) || Date.now(),
      };

      console.log("Task created:", newTask);

      // Add the new task to the tasks list
      setTasks((prevTasks) => [newTask, ...prevTasks]);

      return Promise.resolve();
    } catch (error) {
      console.error("Failed to create task:", error);
      return Promise.reject(error);
    }
  };

  // Handle editing a task
  const handleEditTask = (task: Task) => {
    setTaskToEdit(task);
    setIsEditTaskDialogOpen(true);
  };

  // Handle saving edited task
  const handleSaveEditedTask = async (
    taskId: number,
    data: z.infer<typeof taskFormSchema>
  ) => {
    try {
      // Validate the data using the schema
      taskFormSchema.parse(data);

      // Update the task in the tasks list
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId
            ? {
                ...task,
                name: data.name,
                projectId: parseInt(data.projectId),
                activityId: parseInt(data.activityId),
              }
            : task
        )
      );

      // If the edited task is the active task, update it
      if (activeTask && activeTask.id === taskId) {
        setActiveTask({
          ...activeTask,
          name: data.name,
          projectId: parseInt(data.projectId),
          activityId: parseInt(data.activityId),
        });
      }

      console.log("Task updated:", taskId, data);

      return Promise.resolve();
    } catch (error) {
      console.error("Failed to update task:", error);
      return Promise.reject(error);
    }
  };

  return (
    <div className="flex flex-col md:flex-row grow bg-background">
      <div className="w-full md:w-1/2 p-2 md:p-4 flex">
        <div className="w-full max-w-2xl mx-auto">
          <Stopwatch
            activeTask={activeTask}
            onStartTracking={handleStartTracking}
            onStopTracking={handleStopTracking}
            onClearTask={handleClearActiveTask}
            taskRecords={taskRecords}
          />
        </div>
      </div>
      <div className="w-full md:w-1/2 p-2 md:p-4 bg-card">
        <div className="w-full max-w-2xl mx-auto">
          <TaskList
            tasks={filteredTasks}
            projects={projects}
            activities={initialActivities}
            taskRecords={taskRecords}
            activeTaskId={activeTaskId}
            onSelectTask={handleSelectTask}
            onClearSelection={handleClearActiveTask}
            onAddTask={() => setIsAddTaskDialogOpen(true)}
            onEditTask={handleEditTask}
          />
        </div>
      </div>

      <AddTaskDialog
        open={isAddTaskDialogOpen}
        onOpenChange={setIsAddTaskDialogOpen}
        projects={projects}
        activities={initialActivities}
        onAddTask={handleAddTask}
      />

      <EditTaskDialog
        open={isEditTaskDialogOpen}
        onOpenChange={setIsEditTaskDialogOpen}
        task={taskToEdit}
        projects={projects}
        activities={initialActivities}
        onEditTask={handleSaveEditedTask}
      />
    </div>
  );
}
