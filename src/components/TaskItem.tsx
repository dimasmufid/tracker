"use client";

import { Button } from "@/components/ui/button";
import {
  PlayIcon,
  CheckCircleIcon,
  TagIcon,
  PencilIcon,
  ClockIcon,
  XCircleIcon,
} from "lucide-react";
import { formatDuration } from "@/utils/timeUtils";
import { ClientOnly } from "./ClientOnly";
import { useEffect, useState } from "react";

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
  onSelect: (taskId: number) => Promise<void>;
  onClearSelection?: () => void;
  onEdit: (task: Task) => void;
  activityName?: string;
  totalTime: number;
};

export default function TaskItem({
  task,
  isActive,
  onSelect,
  onClearSelection,
  onEdit,
  activityName,
  totalTime,
}: TaskItemProps) {
  const [wasActive, setWasActive] = useState(isActive);
  const [animateHighlight, setAnimateHighlight] = useState(false);
  const [animateSelection, setAnimateSelection] = useState(false);

  // Detect when a task becomes active and trigger animation
  useEffect(() => {
    if (isActive && !wasActive) {
      setAnimateHighlight(true);
      setAnimateSelection(true);

      const highlightTimer = setTimeout(() => {
        setAnimateHighlight(false);
      }, 1000); // Highlight animation duration

      const selectionTimer = setTimeout(() => {
        setAnimateSelection(false);
      }, 500); // Selection animation duration

      return () => {
        clearTimeout(highlightTimer);
        clearTimeout(selectionTimer);
      };
    }
    setWasActive(isActive);
  }, [isActive, wasActive]);

  const handleTaskClick = async () => {
    if (isActive && onClearSelection) {
      onClearSelection();
    } else {
      await onSelect(task.id);
    }
  };

  return (
    <div
      className={`p-2 rounded-md flex justify-between items-center cursor-pointer transition-all ${
        isActive
          ? "bg-primary/10 border border-primary shadow-sm"
          : "bg-card border border-border hover:border-primary/30 hover:shadow-sm"
      } ${animateHighlight ? "animate-highlight" : ""} ${
        animateSelection ? "animate-selection" : ""
      }`}
      onClick={handleTaskClick}
    >
      <div className="flex flex-col">
        <div className="flex items-center">
          {isActive ? (
            <CheckCircleIcon className="h-4 w-4 text-primary mr-2" />
          ) : (
            <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 mr-2"></div>
          )}
          <h3
            className={`font-medium text-sm ${isActive ? "text-primary" : ""}`}
          >
            {task.name}
          </h3>
        </div>
        <div className="flex items-center ml-6 mt-1 gap-3">
          {activityName && (
            <div className="flex items-center text-xs text-muted-foreground">
              <TagIcon className="h-3 w-3 mr-1" />
              {activityName}
            </div>
          )}
          <div className="flex items-center text-xs text-muted-foreground">
            <ClockIcon className="h-3 w-3 mr-1" />
            <ClientOnly fallback="--:--:--">
              {formatDuration(totalTime)}
            </ClientOnly>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(task);
          }}
        >
          <PencilIcon className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="sr-only">Edit</span>
        </Button>
        {isActive ? (
          <Button
            variant="default"
            size="sm"
            className="bg-primary hover:bg-primary/90 text-primary-foreground h-7 px-2"
            onClick={(e) => {
              e.stopPropagation();
              if (onClearSelection) {
                onClearSelection();
              }
            }}
          >
            <XCircleIcon className="h-3.5 w-3.5" />
            <span className="ml-1 text-xs">Deselect</span>
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground h-7 px-2"
            onClick={async (e) => {
              e.stopPropagation();
              await onSelect(task.id);
            }}
          >
            <PlayIcon className="h-3.5 w-3.5" />
            <span className="ml-1 text-xs">Select</span>
          </Button>
        )}
      </div>
    </div>
  );
}
