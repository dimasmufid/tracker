"use client";

import {
  LineChart,
  MoreVertical,
  TimerResetIcon,
  CalendarIcon,
} from "lucide-react";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DropdownDay } from "./DropdownDay";

export default function Header() {
  const router = useRouter();

  return (
    <div className="w-full bg-secondary flex flex-row justify-between items-center px-3 py-2 md:px-4">
      <div className="container mx-auto max-w-7xl flex justify-between items-center">
        {/* logo */}
        <div className="flex flex-row items-center gap-2">
          <TimerResetIcon className="w-5 h-5" />
          <h1 className="text-lg font-bold">
            Time<span className="font-thin">Tracker</span>
          </h1>
        </div>

        {/* main actions */}
        <div className="flex flex-row items-center gap-2">
          <DropdownDay />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="ml-auto">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => router.push("/dashboard")}>
                  <LineChart className="w-4 h-4 mr-2" />
                  <span>Dashboard</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  <span>Calendar</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
