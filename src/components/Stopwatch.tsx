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
  // Initialize with explicit values to avoid hydration issues
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [todayTotal, setTodayTotal] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  // Find the current active record - do this calculation outside of effects
  const activeRecord = taskRecords?.find((record) => record.endedAt === null);

  // One-time initialization after component mounts
  useEffect(() => {
    if (isInitialized) return;

    // Determine initial running state based on active record
    const shouldBeRunning = !!activeRecord;

    if (shouldBeRunning) {
      const normalizedStartTime =
        normalizeTimestamp(activeRecord.startedAt) || Date.now();
      const elapsed = Date.now() - normalizedStartTime;
      setTime(Math.max(0, elapsed));
    }

    setIsRunning(shouldBeRunning);
    setIsInitialized(true);

    console.log("Stopwatch initialized:", {
      activeTask: activeTask
        ? { id: activeTask.id, name: activeTask.name }
        : null,
      activeRecord: activeRecord
        ? {
            id: activeRecord.id,
            taskId: activeRecord.taskId,
            startedAt: normalizeTimestamp(activeRecord.startedAt),
            endedAt: activeRecord.endedAt,
          }
        : null,
      isRunning: shouldBeRunning,
      time: shouldBeRunning
        ? Math.max(
            0,
            Date.now() -
              (normalizeTimestamp(activeRecord?.startedAt) || Date.now())
          )
        : 0,
    });
  }, [activeRecord, activeTask, isInitialized]);

  // Force re-check of running state when taskRecords change
  useEffect(() => {
    if (!isInitialized) return;

    // Check if there's an active record for the current task
    const hasActiveRecord =
      activeTask &&
      taskRecords?.some(
        (record) => record.taskId === activeTask.id && record.endedAt === null
      );

    // If the UI state doesn't match the database state, correct it
    if (isRunning !== !!hasActiveRecord) {
      console.warn(
        "Running state mismatch detected during taskRecords update. Correcting..."
      );
      console.log({
        uiState: isRunning ? "running" : "paused",
        dbState: hasActiveRecord ? "running" : "paused",
        activeTaskId: activeTask?.id,
        taskRecordsCount: taskRecords?.length,
      });

      setIsRunning(!!hasActiveRecord);

      // If we corrected to running, update the time
      if (hasActiveRecord && activeTask) {
        const activeRec = taskRecords.find(
          (record) => record.taskId === activeTask.id && record.endedAt === null
        );
        if (activeRec) {
          const normalizedStartTime =
            normalizeTimestamp(activeRec.startedAt) || Date.now();
          const elapsed = Date.now() - normalizedStartTime;
          setTime(Math.max(0, elapsed));
        }
      }
    }
  }, [taskRecords, activeTask, isRunning, isInitialized]);

  // Update document title with timer state
  useDocumentTitle(time, isRunning, activeTask?.name);

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

  // Timer interval effect
  useEffect(() => {
    // Only run this effect on the client after initialization
    if (!isInitialized) return;

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Only start the interval if we're running
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime((prevTime) => prevTime + 1000); // Increment by 1 second
      }, 1000);

      console.log("Timer interval started");
    } else {
      console.log("Timer interval stopped");
    }

    // Cleanup on unmount or when isRunning changes
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        console.log("Timer interval cleared");
      }
    };
  }, [isRunning, isInitialized]);

  // Reset timer when active task changes
  useEffect(() => {
    // Only run this effect on the client after initialization
    if (!isInitialized) return;

    // Only reset the timer if we're not running and the active task changes
    if (!isRunning && activeTask) {
      console.log("Resetting timer for new task:", activeTask.id);
      setTime(0);
    }
  }, [activeTask, isRunning, isInitialized]);

  const toggleTimer = async () => {
    if (!activeTask || !isInitialized) return;

    try {
      // Get the current state from the database
      const hasActiveRecord = taskRecords?.some(
        (record) => record.taskId === activeTask.id && record.endedAt === null
      );

      // If the UI state doesn't match the database state, correct it
      if (isRunning !== hasActiveRecord) {
        console.warn(
          "UI running state doesn't match database state. Correcting..."
        );
        console.log({
          uiState: isRunning ? "running" : "paused",
          dbState: hasActiveRecord ? "running" : "paused",
          activeTaskId: activeTask.id,
          taskRecordsCount: taskRecords?.length,
        });

        setIsRunning(hasActiveRecord);

        toast({
          title: "State corrected",
          description: `Timer state has been corrected to ${
            hasActiveRecord ? "running" : "paused"
          }.`,
          variant: "default",
        });

        // If we corrected to running, update the time
        if (hasActiveRecord) {
          const activeRec = taskRecords.find(
            (record) =>
              record.taskId === activeTask.id && record.endedAt === null
          );
          if (activeRec) {
            const normalizedStartTime =
              normalizeTimestamp(activeRec.startedAt) || Date.now();
            const elapsed = Date.now() - normalizedStartTime;
            setTime(Math.max(0, elapsed));
          }
        }

        return;
      }

      // Normal flow - toggle the timer state
      if (isRunning) {
        // We're currently running, so stop tracking
        if (!hasActiveRecord) {
          console.warn(
            "No active record found for this task, but UI shows running"
          );
          // Just update the UI state without calling the API
          setIsRunning(false);
          return;
        }

        await onStopTracking(activeTask.id);
        toast({
          title: "Timer paused",
          description: `Tracking paused for "${activeTask.name}"`,
          variant: "default",
        });
        setIsRunning(false);
      } else {
        // We're currently paused, so start tracking

        // Check if there's any active record for any task
        const anyActiveRecord = taskRecords?.some(
          (record) => record.endedAt === null
        );

        if (anyActiveRecord) {
          console.warn(
            "Found an active record for another task. Will stop it first."
          );

          // Find the task with the active record
          const activeRecordTaskId = taskRecords.find(
            (record) => record.endedAt === null
          )?.taskId;

          if (activeRecordTaskId && activeRecordTaskId !== activeTask.id) {
            // Stop the other task's tracking first
            try {
              await onStopTracking(activeRecordTaskId);
              console.log(
                `Stopped tracking for task #${activeRecordTaskId} before starting new task`
              );
            } catch (error) {
              console.error(
                `Failed to stop tracking for task #${activeRecordTaskId}:`,
                error
              );
            }
          }
        }

        setTime(0); // Reset timer when starting new session
        await onStartTracking(activeTask.id);
        toast({
          title: "Timer started",
          description: `Now tracking "${activeTask.name}"`,
          variant: "default",
        });
        setIsRunning(true);
      }
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

  // Calculate time since active record started - only run this if we're already running
  useEffect(() => {
    // Only run this effect on the client after initialization
    if (!isInitialized) return;

    // Only update time if we're running and there's an active record
    if (isRunning && activeRecord) {
      const normalizedStartTime =
        normalizeTimestamp(activeRecord.startedAt) || Date.now();
      const elapsed = Date.now() - normalizedStartTime;
      // Ensure we don't set negative time
      setTime(Math.max(0, elapsed));
    }
  }, [activeRecord, isRunning, isInitialized]);

  // Debug logging
  useEffect(() => {
    if (!isInitialized) return;

    if (taskRecords?.length > 0) {
      const firstRecord = taskRecords[0];
      console.log("Stopwatch state:", {
        isRunning,
        activeTask: activeTask
          ? { id: activeTask.id, name: activeTask.name }
          : null,
        activeRecord: activeRecord
          ? {
              id: activeRecord.id,
              taskId: activeRecord.taskId,
              startedAt: normalizeTimestamp(activeRecord.startedAt),
              elapsed: activeRecord
                ? Date.now() -
                  (normalizeTimestamp(activeRecord.startedAt) || Date.now())
                : null,
            }
          : null,
        firstRecord: {
          id: firstRecord.id,
          taskId: firstRecord.taskId,
          startedAt: normalizeTimestamp(firstRecord.startedAt),
          endedAt: firstRecord.endedAt
            ? normalizeTimestamp(firstRecord.endedAt)
            : null,
          duration: calculateDuration(
            firstRecord.startedAt,
            firstRecord.endedAt
          ),
        },
      });
    }
  }, [taskRecords, activeTask, activeRecord, isRunning, isInitialized]);

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
