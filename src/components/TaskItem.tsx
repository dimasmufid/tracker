"use client";

import { Button } from "@/components/ui/button";
import { PlayIcon, CheckCircleIcon } from "lucide-react";

type Task = {
  id: number;
  name: string;
  projectId: number;
  activityId: number;
  createdAt: number;
};

type TaskItemProps = {
  task: Task;
  isActive: boolean;
  onSelect: (taskId: number) => void;
};

export default function TaskItem({ task, isActive, onSelect }: TaskItemProps) {
  return (
    <div
      className={`p-2 mb-1.5 rounded-md flex justify-between items-center cursor-pointer transition-all ${
        isActive
          ? "bg-primary/10 border border-primary shadow-sm"
          : "bg-card border border-border hover:border-primary/30 hover:shadow-sm"
      }`}
      onClick={() => onSelect(task.id)}
    >
      <div className="flex items-center">
        {isActive ? (
          <CheckCircleIcon className="h-4 w-4 text-primary mr-2" />
        ) : (
          <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 mr-2"></div>
        )}
        <h3 className={`font-medium text-sm ${isActive ? "text-primary" : ""}`}>
          {task.name}
        </h3>
      </div>
      <Button
        variant={isActive ? "default" : "ghost"}
        size="sm"
        className={
          isActive
            ? "bg-primary hover:bg-primary/90 text-primary-foreground h-7 px-2"
            : "text-muted-foreground h-7 px-2"
        }
        onClick={(e) => {
          e.stopPropagation();
          onSelect(task.id);
        }}
      >
        <PlayIcon className="h-3.5 w-3.5" />
        <span className="ml-1 text-xs">{isActive ? "Active" : "Start"}</span>
      </Button>
    </div>
  );
}
