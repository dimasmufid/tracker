"use client";

import TaskItem from "./TaskItem";
import { PlusCircleIcon, FolderIcon, ClockIcon, InfoIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDuration, calculateDuration } from "@/utils/timeUtils";
import { useMemo, useEffect, useState } from "react";
import { ClientOnly } from "./ClientOnly";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Task = {
  id: number;
  name: string;
  project_id: number;
  activity_id: number;
  created_at: number;
};

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

type TaskRecord = {
  id: number;
  task_id: number;
  started_at: number;
  ended_at: number | null;
};

type TaskListProps = {
  tasks: Task[];
  projects: Project[];
  activities?: Activity[];
  taskRecords: TaskRecord[];
  activeTaskId: number | null;
  onSelectTask: (taskId: number) => Promise<void>;
  onClearSelection?: () => void;
  onAddTask: () => void;
  onEditTask: (task: Task) => void;
  onTaskDeleted?: (taskId: number) => void;
};

export default function TaskList({
  tasks,
  projects,
  activities = [],
  taskRecords,
  activeTaskId,
  onSelectTask,
  onClearSelection,
  onAddTask,
  onEditTask,
  onTaskDeleted,
}: TaskListProps) {
  // Keep track of the previous active task ID to detect changes
  const [prevActiveTaskId, setPrevActiveTaskId] = useState<number | null>(null);

  // Keep track of which projects should be animated
  const [animatedProjectIds, setAnimatedProjectIds] = useState<number[]>([]);

  // Memoize task records by task ID for efficient lookup
  const taskRecordsByTaskId = useMemo(() => {
    const recordMap: Record<number, TaskRecord[]> = {};

    taskRecords.forEach((record) => {
      if (!recordMap[record.task_id]) {
        recordMap[record.task_id] = [];
      }
      recordMap[record.task_id].push(record);
    });

    return recordMap;
  }, [taskRecords]);

  // Group tasks by project
  const tasksByProject = useMemo(() => {
    const groupedTasks: Record<number, Task[]> = {};

    // Group tasks by project
    tasks.forEach((task) => {
      const project_id = task.project_id;
      if (!groupedTasks[project_id]) {
        groupedTasks[project_id] = [];
      }
      groupedTasks[project_id].push(task);
    });

    return groupedTasks;
  }, [tasks]);

  // Filter projects to only show those with tasks
  const projectsWithTasks = useMemo(() => {
    return projects.filter((project) => {
      // Check if this project has any tasks
      return tasksByProject[project.id]?.length > 0;
    });
  }, [projects, tasksByProject]);

  // Count of hidden projects (projects with no tasks)
  const hiddenProjectsCount = useMemo(() => {
    return projects.length - projectsWithTasks.length;
  }, [projects, projectsWithTasks]);

  // Effect to detect when active task changes and trigger animations
  useEffect(() => {
    if (activeTaskId !== prevActiveTaskId) {
      // Find the project ID of the active task
      if (activeTaskId) {
        const activeTask = tasks.find((task) => task.id === activeTaskId);
        if (activeTask) {
          // Add the project ID to the animated projects list
          setAnimatedProjectIds([activeTask.project_id]);

          // Clear the animation after a delay
          const timer = setTimeout(() => {
            setAnimatedProjectIds([]);
          }, 1000); // Match animation duration

          return () => clearTimeout(timer);
        }
      }

      setPrevActiveTaskId(activeTaskId);
    }
  }, [activeTaskId, prevActiveTaskId, tasks]);

  // Get activity name by id
  const getActivityName = (activityId: number) => {
    const activity = activities.find((a) => a.id === activityId);
    return activity?.name || "No activity";
  };

  // Calculate total time for a task
  const calculateTaskTotalTime = (taskId: number) => {
    const taskRecordsForTask = taskRecordsByTaskId[taskId] || [];
    let totalTime = 0;

    taskRecordsForTask.forEach((record) => {
      totalTime += calculateDuration(record.started_at, record.ended_at);
    });

    return totalTime;
  };

  // Calculate total time for a project
  const calculateProjectTotalTime = (projectId: number) => {
    const tasksInProject = tasksByProject[projectId] || [];
    let totalTime = 0;

    tasksInProject.forEach((task) => {
      totalTime += calculateTaskTotalTime(task.id);
    });

    return totalTime;
  };

  return (
    <div className="h-full flex flex-col pt-4 md:pt-8">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <FolderIcon className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Projects</h2>
          {hiddenProjectsCount > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center text-xs text-muted-foreground ml-2 cursor-help">
                    <InfoIcon className="h-3.5 w-3.5 mr-1" />
                    <span>{hiddenProjectsCount} hidden</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {hiddenProjectsCount} project
                    {hiddenProjectsCount !== 1 ? "s" : ""} with no tasks{" "}
                    {hiddenProjectsCount !== 1 ? "are" : "is"} hidden. Create a
                    task for these projects to make them visible.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-primary/30 text-foreground hover:bg-primary/5"
          onClick={onAddTask}
        >
          <PlusCircleIcon className="h-5 w-5 mr-1.5 text-primary" />
          <span>Add Task</span>
        </Button>
      </div>

      <div className="space-y-4 overflow-y-auto flex-grow pr-1">
        {projectsWithTasks.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground bg-muted/50 rounded-lg border border-dashed border-border p-4">
            <p className="text-muted-foreground mb-2">No tasks available</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={onAddTask}
            >
              <PlusCircleIcon className="h-4 w-4 mr-1" />
              Create a task to get started
            </Button>
            {hiddenProjectsCount > 0 && (
              <p className="text-xs text-muted-foreground mt-4">
                You have {hiddenProjectsCount} project
                {hiddenProjectsCount !== 1 ? "s" : ""} available for new tasks.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {projectsWithTasks.map((project) => {
              const projectTotalTime = calculateProjectTotalTime(project.id);
              const shouldAnimate = animatedProjectIds.includes(project.id);
              const activeProject =
                tasks.find((t) => t.id === activeTaskId)?.project_id ===
                project.id;

              return (
                <div
                  key={project.id}
                  className={`bg-card rounded-lg overflow-hidden border border-border shadow-sm transition-all duration-500 ease-in-out ${
                    shouldAnimate ? "animate-move-to-top" : ""
                  } ${activeProject ? "relative z-10" : ""}`}
                >
                  <div
                    className="font-medium px-4 py-3 flex items-center justify-between"
                    style={{
                      backgroundColor: `${project.color}20`,
                      borderLeft: `4px solid ${project.color}`,
                    }}
                  >
                    <div className="flex items-center">
                      <span
                        className="h-3 w-3 rounded-full mr-2"
                        style={{ backgroundColor: project.color }}
                      ></span>
                      <span>{project.name}</span>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <ClockIcon className="h-3.5 w-3.5 mr-1.5" />
                      <ClientOnly fallback="--:--:--">
                        {formatDuration(projectTotalTime)}
                      </ClientOnly>
                    </div>
                  </div>
                  <div className="p-2 space-y-2">
                    {tasksByProject[project.id]?.map((task) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        isActive={task.id === activeTaskId}
                        onSelect={onSelectTask}
                        onClearSelection={onClearSelection}
                        onEdit={onEditTask}
                        activityName={getActivityName(task.activity_id)}
                        totalTime={calculateTaskTotalTime(task.id)}
                        onTaskDeleted={onTaskDeleted}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
