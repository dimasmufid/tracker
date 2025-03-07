"use client";

import TaskItem from "./TaskItem";
import { PlusCircleIcon, FolderIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

type TaskListProps = {
  tasks: Task[];
  projects: Project[];
  activities?: Activity[];
  activeTaskId: number | null;
  onSelectTask: (taskId: number) => void;
  onAddTask: () => void;
  onEditTask: (task: Task) => void;
};

export default function TaskList({
  tasks,
  projects,
  activities = [],
  activeTaskId,
  onSelectTask,
  onAddTask,
  onEditTask,
}: TaskListProps) {
  // Group tasks by project
  const tasksByProject = tasks.reduce((acc, task) => {
    const projectId = task.projectId;
    if (!acc[projectId]) {
      acc[projectId] = [];
    }
    acc[projectId].push(task);
    return acc;
  }, {} as Record<number, Task[]>);

  // Get activity name by id
  const getActivityName = (activityId: number) => {
    const activity = activities.find((a) => a.id === activityId);
    return activity?.name || "No activity";
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
          projects.map((project) => (
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
                <Badge variant="outline" className="text-xs font-normal">
                  {tasksByProject[project.id]?.length || 0} tasks
                </Badge>
              </div>
              <div className="p-2">
                {tasksByProject[project.id]?.length ? (
                  tasksByProject[project.id].map((task) => (
                    <div key={task.id} className="mb-2 last:mb-0">
                      <TaskItem
                        key={task.id}
                        task={task}
                        isActive={task.id === activeTaskId}
                        onSelect={onSelectTask}
                        onEdit={onEditTask}
                        activityName={getActivityName(task.activityId)}
                      />
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground py-3 px-2 italic text-center">
                    No tasks in this project
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
