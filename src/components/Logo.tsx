"use client";

import { CheckCircle2Icon } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

export function Logo({ className, showText = true, size = "md" }: LogoProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative">
        <CheckCircle2Icon className={cn("text-primary", sizeClasses[size])} />
      </div>

      {showText && (
        <h1 className={cn("font-bold", textSizeClasses[size])}>
          Focus<span className="font-thin">Track</span>
        </h1>
      )}
    </div>
  );
}
