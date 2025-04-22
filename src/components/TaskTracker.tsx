"use client";

import { useState, useEffect, useMemo } from "react";
import { startOfDay } from "date-fns";
import Stopwatch from "./Stopwatch";
import TaskList from "./TaskList";
import { AddTaskDialog } from "./AddTaskDialog";
import { EditTaskDialog } from "./EditTaskDialog";
import {
  startTaskTracking,
  stopTaskTracking,
  createTask,
  checkTaskExists,
  updateTask,
} from "@/services/taskService";
import { normalizeTimestamp } from "@/utils/timeUtils";
import { toast } from "@/components/ui/use-toast";
import { useTheme } from "@/contexts/ThemeContext";
import { TaskFormValues } from "@/lib/schemas";
import { markTaskAsDone } from "@/lib/actions";

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

// Define normalized types for client-side use
interface Task {
  id: number;
  name: string;
  project_id: number;
  activity_id: number;
  created_at: number;
}

interface Project {
  id: number;
  name: string;
  description?: string;
  color: string;
  created_at: number;
}

interface TaskRecord {
  id: number;
  task_id: number;
  started_at: number;
  ended_at: number | null;
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
  currentProjects?: Project[];
}

export default function TaskTracker({
  initialTasks,
  initialProjects,
  initialTaskRecords,
  initialActiveTask,
  initialActivities,
  selectedDate,
  currentProjects,
}: TaskTrackerProps) {
  // Convert all dates to timestamps for client-side use
  const [tasks, setTasks] = useState<Task[]>(() =>
    initialTasks.map((task) => ({
      ...task,
      created_at: normalizeTimestamp(task.created_at) || Date.now(),
    }))
  );

  // Use currentProjects if provided, otherwise use initialProjects
  const [projects, setProjects] = useState<Project[]>(() =>
    initialProjects.map((project) => ({
      ...project,
      description: project.description || undefined,
      created_at: normalizeTimestamp(project.created_at) || Date.now(),
    }))
  );

  // Update projects when currentProjects changes
  useEffect(() => {
    if (currentProjects) {
      setProjects(currentProjects);
      console.log("Projects updated from parent:", currentProjects);
    }
  }, [currentProjects]);

  const [taskRecords, setTaskRecords] = useState<TaskRecord[]>(() =>
    initialTaskRecords.map((record) => ({
      ...record,
      started_at: normalizeTimestamp(record.started_at) || Date.now(),
      ended_at: normalizeTimestamp(record.ended_at),
    }))
  );

  const [activeTask, setActiveTask] = useState<Task | null>(() =>
    initialActiveTask
      ? {
          ...initialActiveTask,
          created_at:
            normalizeTimestamp(initialActiveTask.created_at) || Date.now(),
        }
      : null
  );

  const [activeTaskId, setActiveTaskId] = useState<number | null>(
    initialActiveTask?.id || null
  );

  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  const [isEditTaskDialogOpen, setIsEditTaskDialogOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  const { setActiveProjectColor } = useTheme();

  // Verify active task state on initialization
  useEffect(() => {
    // Check if there's an active record in the taskRecords
    const activeRecord = taskRecords.find((record) => record.ended_at === null);

    if (activeRecord) {
      // Find the task associated with this record
      const taskForRecord = tasks.find(
        (task) => task.id === activeRecord.task_id
      );

      if (taskForRecord) {
        // If the active task doesn't match the active record's task, update it
        if (!activeTask || activeTask.id !== taskForRecord.id) {
          console.log("Correcting active task based on active record:", {
            previousActiveTaskId: activeTask?.id,
            newActiveTaskId: taskForRecord.id,
            activeRecordId: activeRecord.id,
          });

          setActiveTask(taskForRecord);
          setActiveTaskId(taskForRecord.id);

          // Update the project color
          const taskProject = projects.find(
            (p) => p.id === taskForRecord.project_id
          );
          if (taskProject) {
            setActiveProjectColor(taskProject.color);
          }
        }
      }
    } else if (activeTask) {
      // If there's no active record but we have an active task, check if it should be active
      const hasActiveRecordForTask = taskRecords.some(
        (record) => record.task_id === activeTask.id && record.ended_at === null
      );

      if (!hasActiveRecordForTask) {
        console.log(
          "No active record found for the current active task. Keeping task selected but not running."
        );
      }
    }
  }, [tasks, taskRecords, activeTask, projects, setActiveProjectColor]);

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
      const taskCreatedAt = task.created_at;
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
        // If there's an active task and it's different from the selected task, stop tracking it first
        if (activeTask && activeTask.id !== taskId) {
          try {
            // Check if the current active task is being tracked
            const isCurrentlyTracking = taskRecords.some(
              (record) =>
                record.task_id === activeTask.id && record.ended_at === null
            );

            if (isCurrentlyTracking) {
              console.log(
                `Pausing previous task #${activeTask.id} before selecting new task #${taskId}`
              );
              await handleStopTracking(activeTask.id);
            }
          } catch (error) {
            console.error("Error stopping previous task:", error);
            toast({
              title: "Warning",
              description:
                "Could not pause the previous task. Continuing with new task selection.",
              variant: "destructive",
            });
          }
        }

        // Set the new active task
        setActiveTask(selectedTask);
        setActiveTaskId(taskId);

        // Permanently reorder tasks to put the selected task at the top of its project's list
        const reorderedTasks = [
          // First include the selected task
          selectedTask,
          // Then include all other tasks except the selected one
          ...tasks.filter((task) => task.id !== taskId),
        ];
        setTasks(reorderedTasks);

        // Get the project color for the selected task
        const taskProject = projects.find(
          (p) => p.id === selectedTask.project_id
        );

        if (taskProject) {
          console.log(
            "Setting active project color:",
            taskProject.color,
            "for project:",
            taskProject
          );
          setActiveProjectColor(taskProject.color);

          // Permanently reorder projects to put the selected task's project at the top
          const reorderedProjects = [
            // First include the project of the selected task
            taskProject,
            // Then include all other projects except the selected task's project
            ...projects.filter((project) => project.id !== taskProject.id),
          ];
          setProjects(reorderedProjects);
        } else {
          console.warn("Project not found for task:", selectedTask);
        }

        // Automatically start tracking the newly selected task
        try {
          // Check if the task is already being tracked
          const isAlreadyTracking = taskRecords.some(
            (record) => record.task_id === taskId && record.ended_at === null
          );

          if (!isAlreadyTracking) {
            console.log(
              `Automatically starting tracking for newly selected task #${taskId}`
            );
            await handleStartTracking(taskId);
          }
        } catch (error) {
          console.error("Error starting new task:", error);
          toast({
            title: "Warning",
            description: "Could not automatically start the selected task.",
            variant: "destructive",
          });
        }
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
    setActiveProjectColor(null); // Reset the theme
  };

  // Start tracking a task
  const handleStartTracking = async (taskId: number) => {
    try {
      const result = await startTaskTracking(taskId);
      if (result && result.length > 0) {
        // Add the new record to the list
        const newRecord: TaskRecord = {
          ...result[0],
          started_at: normalizeTimestamp(result[0].started_at) || Date.now(),
          ended_at: normalizeTimestamp(result[0].ended_at),
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
          started_at: normalizeTimestamp(result[0].started_at) || Date.now(),
          ended_at: normalizeTimestamp(result[0].ended_at),
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
  const handleAddTask = async (data: TaskFormValues) => {
    try {
      // Create the task in the database
      const newTaskData = await createTask(
        data.name,
        parseInt(data.project_id),
        parseInt(data.activity_id)
      );

      // Convert the returned task to the client-side format
      const newTask: Task = {
        ...newTaskData,
        created_at: normalizeTimestamp(newTaskData.created_at) || Date.now(),
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
  const handleSaveEditedTask = async (taskId: number, data: TaskFormValues) => {
    try {
      // Update the task in the database
      const updatedTaskData = await updateTask(
        taskId,
        data.name,
        parseInt(data.project_id),
        parseInt(data.activity_id)
      );

      // Convert the returned task to the client-side format
      const updatedTask: Task = {
        ...updatedTaskData,
        created_at:
          normalizeTimestamp(updatedTaskData.created_at) || Date.now(),
      };

      // Update the task in the tasks list
      setTasks((prevTasks) =>
        prevTasks.map((task) => (task.id === taskId ? updatedTask : task))
      );

      // If the edited task is the active task, update it
      if (activeTask && activeTask.id === taskId) {
        setActiveTask(updatedTask);
      }

      console.log("Task updated:", taskId, updatedTask);

      return Promise.resolve();
    } catch (error) {
      console.error("Failed to update task:", error);
      return Promise.reject(error);
    }
  };

  // Update active project color when projects change
  useEffect(() => {
    if (activeTask && projects.length > 0) {
      const taskProject = projects.find((p) => p.id === activeTask.project_id);
      if (taskProject) {
        console.log(
          "Updating active project color from useEffect:",
          taskProject.color
        );
        setActiveProjectColor(taskProject.color);
      } else {
        console.warn(
          "Project not found for active task in useEffect:",
          activeTask
        );
      }
    }
  }, [projects, activeTask, setActiveProjectColor]);

  // Handle marking a task as done
  const handleMarkTaskAsDone = async (taskId: number) => {
    console.log(`Attempting to mark task ${taskId} as done`);
    try {
      const response = await markTaskAsDone(taskId);

      if (!response.success) {
        throw new Error("Failed to mark task as done");
      }

      // Remove task from local state
      setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));

      // If the done task was active, clear active state
      if (activeTask && activeTask.id === taskId) {
        setActiveTask(null);
        setActiveTaskId(null);
        setActiveProjectColor(null); // Reset theme color
      }

      toast({
        title: "Task Completed",
        description: "The task has been marked as done.",
      });
    } catch (error) {
      console.error(`Error marking task ${taskId} as done:`, error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Could not mark task as done.",
        variant: "destructive",
      });
    }
  };

  // Handle task deletion
  const handleTaskDeleted = (taskId: number) => {
    // Remove the task from the tasks list
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));

    // If the deleted task is the active task, clear it
    if (activeTask && activeTask.id === taskId) {
      setActiveTask(null);
      setActiveTaskId(null);
      setActiveProjectColor("");
    }

    toast({
      title: "Task deleted",
      description: "The task has been deleted successfully.",
    });
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
            onTaskDeleted={handleTaskDeleted}
            onMarkTaskAsDone={handleMarkTaskAsDone}
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
