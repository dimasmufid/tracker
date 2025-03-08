"use client";

import { useEffect } from "react";
import { formatDuration } from "@/utils/timeUtils";

/**
 * Custom hook to update the document title with the current timer state
 * @param time Current timer value in milliseconds
 * @param isRunning Whether the timer is currently running
 * @param taskName Optional task name to include in the title
 */
export function useDocumentTitle(
  time: number,
  isRunning: boolean,
  taskName?: string
) {
  useEffect(() => {
    // Only run on the client side
    if (typeof window === "undefined") return;

    // Format the time as MM:SS
    const formattedTime = formatDuration(time);

    // Extract just the minutes and seconds for a cleaner title
    const timeComponents = formattedTime.split(":");
    const minutesAndSeconds =
      timeComponents.length > 2
        ? `${timeComponents[1]}:${timeComponents[2]}`
        : formattedTime;

    // Create the title with the timer state
    let title = `${minutesAndSeconds}`;

    // Add task name if provided
    if (taskName) {
      title += ` | ${taskName}`;
    }

    // Add status indicator
    title += isRunning ? " ▶" : " ⏸";

    // Update the document title
    document.title = title;

    // Restore the original title when the component unmounts
    return () => {
      document.title = "FocusTrack - Mindful Time Management";
    };
  }, [time, isRunning, taskName]);
}
