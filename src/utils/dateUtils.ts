export function convertDatesToTimestamps<T>(obj: T): T {
  if (!obj) return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => convertDatesToTimestamps(item)) as unknown as T;
  }

  if (typeof obj === "object" && obj !== null) {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (value instanceof Date) {
        result[key] = value.getTime();
      } else if (typeof value === "object" && value !== null) {
        result[key] = convertDatesToTimestamps(value);
      } else {
        result[key] = value;
      }
    }

    return result as T;
  }

  return obj;
}
