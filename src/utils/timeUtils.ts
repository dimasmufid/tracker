/**
 * Normalizes a timestamp from various formats to a standard JavaScript timestamp (milliseconds since epoch)
 *
 * @param timestamp The timestamp to normalize, can be a Date object, number, or null
 * @returns A normalized timestamp as milliseconds since epoch, or null if input is null
 */
export function normalizeTimestamp(
  timestamp: Date | number | null
): number | null {
  if (timestamp === null) return null;

  // If it's a Date object, convert to milliseconds
  if (timestamp instanceof Date) {
    return timestamp.getTime();
  }

  // If it's a reasonable timestamp (within the last year to near future)
  const now = Date.now();
  const oneYearAgo = now - 365 * 24 * 60 * 60 * 1000;
  if (timestamp > oneYearAgo && timestamp < now + 1000 * 60 * 60 * 24) {
    return timestamp;
  }

  // Try to interpret as a JavaScript Date
  const dateObj = new Date(timestamp);
  if (!isNaN(dateObj.getTime())) {
    return dateObj.getTime();
  }

  // For SQLite timestamp_ms format (which can be very large numbers)
  // Try to extract a reasonable date
  const timestampStr = timestamp.toString();
  if (timestampStr.length >= 13) {
    // Try to extract the first 13 digits (standard JS timestamp length)
    const extracted = parseInt(timestampStr.substring(0, 13));
    if (!isNaN(extracted) && extracted > oneYearAgo) {
      return extracted;
    }
  }

  console.warn("Could not normalize timestamp:", timestamp);
  return now; // Default to current time if we can't normalize
}

/**
 * Formats a duration in milliseconds to a human-readable HH:MM:SS format
 *
 * @param ms Duration in milliseconds
 * @returns Formatted string in HH:MM:SS format
 */
export function formatDuration(ms: number): string {
  // Ensure we don't have negative time
  ms = Math.max(0, ms);

  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Calculates the duration between two timestamps
 *
 * @param startTime Start timestamp
 * @param endTime End timestamp, defaults to current time if null
 * @returns Duration in milliseconds, or 0 if invalid
 */
export function calculateDuration(
  startTime: number,
  endTime: number | null = null
): number {
  const start = normalizeTimestamp(startTime);
  const end = endTime ? normalizeTimestamp(endTime) : Date.now();

  if (start === null || end === null) return 0;

  // Ensure we don't return negative durations
  return Math.max(0, end - start);
}
