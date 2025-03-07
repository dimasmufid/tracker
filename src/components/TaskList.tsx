"use client";

import TaskItem from "./TaskItem";
import { PlusCircleIcon, FolderIcon, ClockIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDuration, calculateDuration } from "@/utils/timeUtils";
import { useMemo } from "react";
import { ClientOnly } from "./ClientOnly";

type Task = {
  id: number;
  name: string;
  projectId: number;
  activityId: number;
  createdAt: number;
};

type Project = {
  id: number;
  name: string;
  description?: string;
  color: string;
  createdAt: number;
};

type Activity = {
  id: number;
  name: string;
};

type TaskRecord = {
  id: number;
  taskId: number;
  startedAt: number;
  endedAt: number | null;
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
}: TaskListProps) {
  // Memoize task records by task ID for efficient lookup
  const taskRecordsByTaskId = useMemo(() => {
    const recordMap: Record<number, TaskRecord[]> = {};

    taskRecords.forEach((record) => {
      if (!recordMap[record.taskId]) {
        recordMap[record.taskId] = [];
      }
      recordMap[record.taskId].push(record);
    });

    return recordMap;
  }, [taskRecords]);

  // Group tasks by project
  const tasksByProject = useMemo(() => {
    return tasks.reduce((acc, task) => {
      const projectId = task.projectId;
      if (!acc[projectId]) {
        acc[projectId] = [];
      }
      acc[projectId].push(task);
      return acc;
    }, {} as Record<number, Task[]>);
  }, [tasks]);

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
      totalTime += calculateDuration(record.startedAt, record.endedAt);
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
        {projects.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground bg-muted/50 rounded-lg border border-dashed border-border p-4">
            <p className="text-muted-foreground mb-2">No projects available</p>
            <Button variant="outline" size="sm" className="mt-2">
              <PlusCircleIcon className="h-4 w-4 mr-1" />
              Create a project to get started
            </Button>
          </div>
        ) : (
          projects.map((project) => {
            const projectTotalTime = calculateProjectTotalTime(project.id);

            return (
              <div
                key={project.id}
                className="mb-4 bg-card rounded-lg overflow-hidden border border-border shadow-sm"
              >
                <div
                  className="font-medium px-4 py-3 flex items-center justify-between"
                  style={{ backgroundColor: `${project.color}15` }}
                >
                  <div className="flex items-center">
                    <span
                      className="h-3 w-3 rounded-full mr-2 flex-shrink-0"
                      style={{ backgroundColor: project.color }}
                    ></span>
                    <span className="font-semibold">{project.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs font-normal">
                      {tasksByProject[project.id]?.length || 0} tasks
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="text-xs font-normal flex items-center gap-1"
                    >
                      <ClockIcon className="h-3 w-3" />
                      <ClientOnly fallback="--:--:--">
                        {formatDuration(projectTotalTime)}
                      </ClientOnly>
                    </Badge>
                  </div>
                </div>
                <div className="p-2">
                  {tasksByProject[project.id]?.length ? (
                    tasksByProject[project.id].map((task) => {
                      const taskTotalTime = calculateTaskTotalTime(task.id);

                      return (
                        <div key={task.id} className="mb-2 last:mb-0">
                          <TaskItem
                            key={task.id}
                            task={task}
                            isActive={task.id === activeTaskId}
                            onSelect={onSelectTask}
                            onClearSelection={onClearSelection}
                            onEdit={onEditTask}
                            activityName={getActivityName(task.activityId)}
                            totalTime={taskTotalTime}
                          />
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-sm text-muted-foreground py-3 px-2 italic text-center">
                      No tasks in this project
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
