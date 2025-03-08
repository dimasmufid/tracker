"use client";

import * as React from "react";
import { format, startOfDay } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DropdownDayProps {
  selectedDate?: Date;
  onDateChange: (date: Date) => void;
  className?: string;
}

export function DropdownDay({
  selectedDate,
  onDateChange,
  className,
}: DropdownDayProps) {
  // Initialize with today's date if no date is provided
  const [date, setDate] = React.useState<Date>(
    selectedDate || startOfDay(new Date())
  );

  // Set today as default on component mount if no date is provided
  React.useEffect(() => {
    if (!selectedDate) {
      const today = startOfDay(new Date());
      setDate(today);
      onDateChange(today);
    }
  }, [selectedDate, onDateChange]);

  // Handle date selection
  const handleSelect = (newDate: Date | undefined) => {
    if (newDate) {
      const selectedDay = startOfDay(newDate);
      setDate(selectedDay);
      onDateChange(selectedDay);
    }
  };

  // Determine if we're in a mobile context (inside dropdown menu)
  const isMobile = className?.includes("sm:hidden");

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size={isMobile ? "default" : "default"}
          className={cn(
            "justify-start text-left font-normal",
            isMobile ? "w-full" : "w-[180px] md:w-[200px]",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? (
            format(date, isMobile ? "MMM d, yyyy" : "PPP")
          ) : (
            <span>Pick a date</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0"
        align={isMobile ? "center" : "start"}
      >
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
