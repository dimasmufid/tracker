"use client";

import { useState, useEffect, useRef } from "react";
import { PlayIcon, PauseIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Stopwatch() {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime((prevTime) => prevTime + 10); // Increment by 10ms for microsecond precision
      }, 10);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const microseconds = Math.floor((ms % 1000) / 10);

    return `${minutes.toString().padStart(2, "0")}.${seconds
      .toString()
      .padStart(2, "0")}.${microseconds.toString().padStart(2, "0")}`;
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8">
      <div className="text-7xl font-thin tracking-wider">
        {formatTime(time)}
      </div>
      <Button
        onClick={toggleTimer}
        className="rounded-full bg-gray-200 px-6 py-2 text-lg font-medium hover:bg-gray-300"
      >
        {isRunning ? <PauseIcon /> : <PlayIcon />}
      </Button>
    </div>
  );
}
