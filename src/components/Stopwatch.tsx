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
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [todayTotal, setTodayTotal] = useState(0);

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
  }, [isRunning]);

  // Reset timer when active task changes
  useEffect(() => {
    if (!isRunning) {
      setTime(0);
    }
  }, [activeTask, isRunning]);

  const toggleTimer = async () => {
    if (!activeTask) return;

    if (isRunning) {
      await onStopTracking(activeTask.id);
    } else {
      setTime(0); // Reset timer when starting new session
      await onStartTracking(activeTask.id);
    }

    setIsRunning(!isRunning);
  };

  // Find the current active record
  const activeRecord = taskRecords?.find((record) => record.endedAt === null);

  // Calculate time since active record started
  useEffect(() => {
    if (activeRecord && !isRunning) {
      setIsRunning(true);
      const normalizedStartTime =
        normalizeTimestamp(activeRecord.startedAt) || Date.now();
      const elapsed = Date.now() - normalizedStartTime;
      // Ensure we don't set negative time
      setTime(Math.max(0, elapsed));
    }
  }, [activeRecord, isRunning]);

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
    <div className="timer-container active flex flex-col h-full">
      <div className="flex flex-col items-center justify-start gap-6 p-4 pt-8 md:pt-12">
        <div className="text-7xl md:text-8xl font-thin tracking-wider">
          {formatDuration(time)}
        </div>

        <div className="flex flex-col items-center gap-2">
          <Button
            onClick={toggleTimer}
            disabled={!activeTask}
            size="lg"
            className="timer-button rounded-md px-12 py-6 text-lg font-medium transition-all duration-300 hover:scale-105 shadow-md border-none min-w-[180px] uppercase"
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

      <div className="mt-auto p-4 bg-accent/50 backdrop-blur-sm">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <TimerResetIcon className="w-4 h-4 opacity-70" />
            <span className="text-sm opacity-70">Today&apos;s total</span>
          </div>
          <span className="font-medium">{formatDuration(todayTotal)}</span>
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
                      className="flex justify-between items-center text-sm p-2 bg-accent/30 rounded"
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
                <div className="text-sm p-2 text-muted-foreground">
                  No sessions recorded for this task yet
                </div>
              )
            ) : (
              <div className="text-sm p-2 text-muted-foreground">
                Select a task to view its sessions
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
