import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converts a hex color to HSL values
 * @param hex Hex color code (e.g., #FF5733)
 * @returns Array of [hue, saturation, lightness] or null if invalid
 */
export function hexToHSL(hex: string): [number, number, number] | null {
  // Remove the # if present
  hex = hex.replace(/^#/, "");

  // Parse the hex values
  let r, g, b;
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16) / 255;
    g = parseInt(hex[1] + hex[1], 16) / 255;
    b = parseInt(hex[2] + hex[2], 16) / 255;
  } else if (hex.length === 6) {
    r = parseInt(hex.substring(0, 2), 16) / 255;
    g = parseInt(hex.substring(2, 4), 16) / 255;
    b = parseInt(hex.substring(4, 6), 16) / 255;
  } else {
    return null; // Invalid hex
  }

  // Find min and max values
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);

  // Calculate lightness
  let h = 0,
    s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    // Calculate saturation
    s = l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min);

    // Calculate hue
    if (max === r) {
      h = (g - b) / (max - min) + (g < b ? 6 : 0);
    } else if (max === g) {
      h = (b - r) / (max - min) + 2;
    } else {
      h = (r - g) / (max - min) + 4;
    }
    h = h * 60;
  }

  // Round values
  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
}
