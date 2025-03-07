"use client";

import { useState } from "react";
import TaskItem from "./TaskItem";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircleIcon, FolderIcon, ListIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

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

type TaskListProps = {
  tasks: Task[];
  projects: Project[];
  activeTaskId: number | null;
  onSelectTask: (taskId: number) => void;
};

export default function TaskList({
  tasks,
  projects,
  activeTaskId,
  onSelectTask,
}: TaskListProps) {
  const [activeTab, setActiveTab] = useState("tasks");

  // Group tasks by project
  const tasksByProject = tasks.reduce((acc, task) => {
    const projectId = task.projectId;
    if (!acc[projectId]) {
      acc[projectId] = [];
    }
    acc[projectId].push(task);
    return acc;
  }, {} as Record<number, Task[]>);

  return (
    <div className="h-full flex flex-col pt-4 md:pt-8">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-semibold">Tasks</h2>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground"
        >
          <PlusCircleIcon className="h-5 w-5 mr-1" />
          <span>Add Task</span>
        </Button>
      </div>

      <Tabs
        defaultValue="tasks"
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-grow flex flex-col"
      >
        <TabsList className="mb-3 self-center bg-muted p-1 rounded-full">
          <TabsTrigger
            value="tasks"
            className="rounded-full data-[state=active]:bg-background data-[state=active]:text-foreground px-4"
          >
            <ListIcon className="h-4 w-4 mr-1" />
            All Tasks
          </TabsTrigger>
          <TabsTrigger
            value="projects"
            className="rounded-full data-[state=active]:bg-background data-[state=active]:text-foreground px-4"
          >
            <FolderIcon className="h-4 w-4 mr-1" />
            By Project
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="tasks"
          className="space-y-1 overflow-y-auto flex-grow pr-1"
        >
          {tasks.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground bg-muted/50 rounded-lg border border-dashed border-border p-4">
              <p className="text-muted-foreground mb-2">No tasks available</p>
              <Button variant="outline" size="sm" className="mt-2">
                <PlusCircleIcon className="h-4 w-4 mr-1" />
                Create a task to get started
              </Button>
            </div>
          ) : (
            tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                isActive={task.id === activeTaskId}
                onSelect={onSelectTask}
              />
            ))
          )}
        </TabsContent>

        <TabsContent
          value="projects"
          className="space-y-3 overflow-y-auto flex-grow pr-1"
        >
          {projects.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground bg-muted/50 rounded-lg border border-dashed border-border p-4">
              <p className="text-muted-foreground mb-2">
                No projects available
              </p>
              <Button variant="outline" size="sm" className="mt-2">
                <PlusCircleIcon className="h-4 w-4 mr-1" />
                Create a project to get started
              </Button>
            </div>
          ) : (
            projects.map((project) => (
              <div key={project.id} className="mb-3">
                <h3
                  className="font-medium mb-2 px-3 py-2 rounded-md flex items-center"
                  style={{ backgroundColor: `${project.color}15` }}
                >
                  <span
                    className="h-3 w-3 rounded-full mr-2"
                    style={{ backgroundColor: project.color }}
                  ></span>
                  {project.name}
                </h3>
                <div className="pl-2">
                  {tasksByProject[project.id]?.length ? (
                    tasksByProject[project.id].map((task) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        isActive={task.id === activeTaskId}
                        onSelect={onSelectTask}
                      />
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground pl-2 py-2 italic">
                      No tasks in this project
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
