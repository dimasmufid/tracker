"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { TimerResetIcon, ListTodoIcon, XCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import {
  normalizeTimestamp,
  formatDuration,
  calculateDuration,
} from "@/utils/timeUtils";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { ClientOnly } from "./ClientOnly";
import { toast } from "@/components/ui/use-toast";

interface Task {
  id: number;
  name: string;
  projectId: number;
  activityId: number;
  createdAt: number;
}

interface TaskRecord {
  id: number;
  taskId: number;
  startedAt: number;
  endedAt: number | null;
}

interface StopwatchProps {
  activeTask: Task | null;
  onStartTracking: (taskId: number) => Promise<void>;
  onStopTracking: (taskId: number) => Promise<void>;
  onClearTask?: () => void;
  taskRecords: TaskRecord[];
}

export default function Stopwatch({
  activeTask,
  onStartTracking,
  onStopTracking,
  onClearTask,
  taskRecords,
}: StopwatchProps) {
  const [time, setTime] = useState(0);
  // Initialize isRunning to false by default to avoid hydration issues
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [todayTotal, setTodayTotal] = useState(0);
  // Track if component has mounted to avoid hydration issues
  const [hasMounted, setHasMounted] = useState(false);

  // Update document title with timer state
  useDocumentTitle(time, isRunning, activeTask?.name);

  // Set hasMounted to true after component mounts
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Calculate today's total time spent
  useEffect(() => {
    if (!taskRecords?.length) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();

    const todayRecords = taskRecords.filter((record) => {
      const normalizedStartTime = normalizeTimestamp(record.startedAt);
      return (
        normalizedStartTime !== null && normalizedStartTime >= todayTimestamp
      );
    });

    let total = 0;
    todayRecords.forEach((record) => {
      total += calculateDuration(record.startedAt, record.endedAt);
    });

    setTodayTotal(total);
  }, [taskRecords]);

  useEffect(() => {
    // Only run this effect on the client after mounting to avoid hydration issues
    if (!hasMounted) return;

    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime((prevTime) => prevTime + 1000); // Increment by 1 second
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, hasMounted]);

  // Reset timer when active task changes
  useEffect(() => {
    // Only run this effect on the client after mounting to avoid hydration issues
    if (!hasMounted) return;

    if (!isRunning) {
      setTime(0);
    }
  }, [activeTask, isRunning, hasMounted]);

  const toggleTimer = async () => {
    if (!activeTask) return;

    try {
      if (isRunning) {
        // Check if there's actually an active record for this task before stopping
        const hasActiveRecord = taskRecords?.some(
          (record) => record.taskId === activeTask.id && record.endedAt === null
        );

        if (!hasActiveRecord) {
          console.warn(
            "No active record found for this task, but isRunning is true"
          );
          // Reset the running state without calling the API
          setIsRunning(false);
          toast({
            title: "State corrected",
            description: "The timer state has been corrected.",
            variant: "default",
          });
          return;
        }

        await onStopTracking(activeTask.id);
        toast({
          title: "Timer paused",
          description: `Tracking paused for "${activeTask.name}"`,
          variant: "default",
        });
      } else {
        setTime(0); // Reset timer when starting new session
        await onStartTracking(activeTask.id);
        toast({
          title: "Timer started",
          description: `Now tracking "${activeTask.name}"`,
          variant: "default",
        });
      }

      setIsRunning(!isRunning);
    } catch (error) {
      console.error("Timer operation failed:", error);
      toast({
        title: "Operation failed",
        description: `Failed to ${
          isRunning ? "pause" : "start"
        } tracking. Please try again.`,
        variant: "destructive",
      });
    }
  };

  // Find the current active record
  const activeRecord = taskRecords?.find((record) => record.endedAt === null);

  // Calculate time since active record started
  useEffect(() => {
    // Only run this effect on the client after mounting to avoid hydration issues
    if (!hasMounted) return;

    if (activeRecord && !isRunning) {
      setIsRunning(true);
      const normalizedStartTime =
        normalizeTimestamp(activeRecord.startedAt) || Date.now();
      const elapsed = Date.now() - normalizedStartTime;
      // Ensure we don't set negative time
      setTime(Math.max(0, elapsed));
    }
  }, [activeRecord, isRunning, hasMounted]);

  // Debug logging
  useEffect(() => {
    if (taskRecords?.length > 0) {
      const firstRecord = taskRecords[0];
      console.log("First record in Stopwatch:", {
        id: firstRecord.id,
        taskId: firstRecord.taskId,
        startedAt: {
          original: firstRecord.startedAt,
          normalized: normalizeTimestamp(firstRecord.startedAt),
          asDate: new Date(
            normalizeTimestamp(firstRecord.startedAt) || 0
          ).toISOString(),
        },
        endedAt: firstRecord.endedAt
          ? {
              original: firstRecord.endedAt,
              normalized: normalizeTimestamp(firstRecord.endedAt),
              asDate: new Date(
                normalizeTimestamp(firstRecord.endedAt) || 0
              ).toISOString(),
            }
          : null,
        duration: calculateDuration(firstRecord.startedAt, firstRecord.endedAt),
        formattedDuration: formatDuration(
          calculateDuration(firstRecord.startedAt, firstRecord.endedAt)
        ),
      });
    }
  }, [taskRecords]);

  // Filter task records based on active task
  const filteredTaskRecords = useMemo(() => {
    if (!activeTask) {
      return []; // Return empty array when no task is selected
    }
    // Only show records for the active task
    return taskRecords.filter((record) => record.taskId === activeTask.id);
  }, [activeTask, taskRecords]);

  return (
    <div className="timer-container flex flex-col h-full rounded-lg overflow-hidden">
      <div className="flex flex-col items-center justify-start gap-6 p-4 pt-8 md:pt-12">
        <div className="text-7xl md:text-8xl font-thin tracking-wider">
          <ClientOnly fallback="00:00:00">{formatDuration(time)}</ClientOnly>
        </div>

        <div className="flex flex-col items-center gap-2">
          <Button
            onClick={toggleTimer}
            disabled={!activeTask}
            size="lg"
            className="rounded-md px-12 py-6 text-lg font-medium transition-all duration-300 hover:scale-105 shadow-md border-none min-w-[180px] uppercase"
            style={{
              backgroundColor: activeTask ? `hsl(var(--primary))` : undefined,
              color: activeTask ? `hsl(var(--primary-foreground))` : undefined,
            }}
          >
            {isRunning ? "PAUSE" : "START"}
          </Button>

          {activeTask && onClearTask && !isRunning && (
            <Button
              onClick={onClearTask}
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <XCircleIcon className="w-3 h-3" />
              Clear selection
            </Button>
          )}
        </div>

        <div className="text-sm mt-2 opacity-80 text-center">
          {activeTask ? (
            <>
              <span className="font-medium">#{activeTask.id}</span> -{" "}
              {activeTask.name}
              <div className="mt-1 text-xs opacity-70">
                {isRunning ? "Time to focus!" : "Ready to start tracking"}
              </div>
            </>
          ) : (
            <>
              <span className="text-muted-foreground">No task selected</span>
              <div className="mt-1 text-xs opacity-70">
                Select a task from the list to start tracking
              </div>
            </>
          )}
        </div>
      </div>

      <div
        className="mt-auto p-4 backdrop-blur-sm"
        style={
          activeTask
            ? {
                backgroundColor: `hsla(var(--primary)/0.15)`,
                borderTop: `1px solid hsla(var(--primary)/0.2)`,
              }
            : { backgroundColor: "hsla(var(--accent)/0.5)" }
        }
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <TimerResetIcon className="w-4 h-4 opacity-70" />
            <span className="text-sm opacity-70">Today&apos;s total</span>
          </div>
          <span className="font-medium">
            <ClientOnly fallback="--:--:--">
              {formatDuration(todayTotal)}
            </ClientOnly>
          </span>
        </div>

        <div className="mt-3">
          <h3 className="text-sm font-medium mb-2 opacity-80 flex items-center gap-2">
            <ListTodoIcon className="w-4 h-4" />
            {activeTask ? "Task sessions" : "Recent sessions"}
          </h3>
          <div className="space-y-1 max-h-[200px] overflow-y-auto">
            {activeTask ? (
              filteredTaskRecords.length > 0 ? (
                filteredTaskRecords.slice(0, 5).map((record) => {
                  const normalizedStartTime =
                    normalizeTimestamp(record.startedAt) || 0;
                  const duration = calculateDuration(
                    record.startedAt,
                    record.endedAt
                  );

                  return (
                    <div
                      key={record.id}
                      className="flex justify-between items-center text-sm p-2 rounded"
                      style={{
                        backgroundColor: `hsla(var(--primary)/0.1)`,
                        borderLeft: `2px solid hsl(var(--primary))`,
                      }}
                    >
                      <span>
                        {formatDistanceToNow(new Date(normalizedStartTime), {
                          addSuffix: true,
                        })}
                      </span>
                      <span className="font-medium">
                        {formatDuration(duration)}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="text-sm text-muted-foreground text-center py-2">
                  No sessions recorded yet
                </div>
              )
            ) : (
              taskRecords.slice(0, 5).map((record) => {
                const normalizedStartTime =
                  normalizeTimestamp(record.startedAt) || 0;
                const duration = calculateDuration(
                  record.startedAt,
                  record.endedAt
                );

                return (
                  <div
                    key={record.id}
                    className="flex justify-between items-center text-sm p-2 rounded"
                    style={{
                      backgroundColor: `hsla(var(--accent)/0.3)`,
                    }}
                  >
                    <span>
                      {formatDistanceToNow(new Date(normalizedStartTime), {
                        addSuffix: true,
                      })}
                    </span>
                    <span className="font-medium">
                      {formatDuration(duration)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
