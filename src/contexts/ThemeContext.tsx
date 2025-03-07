"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { hexToHSL } from "@/lib/utils";

interface ThemeContextType {
  setActiveProjectColor: (color: string | null) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  const [activeProjectColor, setActiveProjectColor] = useState<string | null>(
    null
  );

  // Update CSS variables when active project changes
  useEffect(() => {
    if (typeof window === "undefined") return; // Skip on server-side

    console.log("Active project color changed:", activeProjectColor);

    if (!activeProjectColor) {
      // Reset to default theme
      document.documentElement.style.removeProperty("--timer-active");
      document.documentElement.style.removeProperty(
        "--timer-active-foreground"
      );
      document.documentElement.style.removeProperty("--timer-button");
      document.documentElement.style.removeProperty(
        "--timer-button-foreground"
      );
      document.documentElement.style.removeProperty("--timer-button-hover");

      // Reset primary color to default
      document.documentElement.style.removeProperty("--primary");
      document.documentElement.style.removeProperty("--primary-foreground");
      document.documentElement.style.removeProperty("--ring");

      return;
    }

    // Convert hex to HSL
    const hsl = hexToHSL(activeProjectColor);
    if (!hsl) {
      console.error("Failed to convert hex to HSL:", activeProjectColor);
      return;
    }

    console.log("Converted HSL:", hsl);
    const [h, s, l] = hsl;

    // Set CSS variables for timer container
    document.documentElement.style.setProperty(
      "--timer-active",
      `${h} ${s}% ${Math.max(10, l - 5)}%`
    );
    document.documentElement.style.setProperty(
      "--timer-active-foreground",
      `${h} ${s}% 98%`
    );
    document.documentElement.style.setProperty(
      "--timer-button",
      `${h} ${s}% ${Math.max(45, l + 10)}%`
    );
    document.documentElement.style.setProperty(
      "--timer-button-foreground",
      `${h} ${Math.min(10, s)}% 98%`
    );
    document.documentElement.style.setProperty(
      "--timer-button-hover",
      `${h} ${s}% ${Math.max(40, l + 5)}%`
    );

    // Also update the primary color to match the project color
    document.documentElement.style.setProperty("--primary", `${h} ${s}% ${l}%`);
    document.documentElement.style.setProperty(
      "--primary-foreground",
      `${h} ${Math.min(10, s)}% 98%`
    );
    document.documentElement.style.setProperty("--ring", `${h} ${s}% ${l}%`);

    // Force a repaint to ensure the styles are applied
    const forceRepaint = () => {
      const height = document.body.offsetHeight; // Trigger a reflow
      return height; // Return value to avoid unused expression
    };
    forceRepaint();

    console.log("Applied CSS variables for color:", activeProjectColor);

    // Debug function to log the current CSS variables
    const logCssVariables = () => {
      const computedStyle = getComputedStyle(document.documentElement);
      console.log("Current CSS variables:");
      console.log(
        "--timer-button:",
        computedStyle.getPropertyValue("--timer-button")
      );
      console.log(
        "--timer-button-foreground:",
        computedStyle.getPropertyValue("--timer-button-foreground")
      );
      console.log(
        "--timer-button-hover:",
        computedStyle.getPropertyValue("--timer-button-hover")
      );
      console.log("--primary:", computedStyle.getPropertyValue("--primary"));
      console.log(
        "--primary-foreground:",
        computedStyle.getPropertyValue("--primary-foreground")
      );
      console.log("--ring:", computedStyle.getPropertyValue("--ring"));
    };

    // Log the CSS variables after a short delay to ensure they've been applied
    setTimeout(logCssVariables, 100);
  }, [activeProjectColor]);

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      <ThemeContext.Provider value={{ setActiveProjectColor }}>
        {children}
      </ThemeContext.Provider>
    </NextThemesProvider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
