"use client";

import { LineChart, MoreVertical, TimerResetIcon } from "lucide-react";
import { DropdownDay } from "./DropdownDay";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { Plus, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
  const router = useRouter();
  return (
    <div className="w-full h-12 bg-secondary flex flex-row justify-between items-center p-2">
      {/* logo */}
      <div className="flex flex-row items-center gap-2">
        <TimerResetIcon className="w-5 h-5" />
        <h1 className="text-lg font-bold">
          Time <span className="font-thin">tracker</span>
        </h1>
      </div>
      {/* main actions */}
      <div className="flex flex-row items-center gap-2">
        <DropdownDay />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => router.push("/dashboard")}>
                <LineChart className="w-4 h-4" />
                <span>Dashboard</span>
                <DropdownMenuShortcut>⇧⌘D</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/settings")}>
                <Settings />
                <span>Settings</span>
                <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Plus />
                <span>Add Project</span>
                <DropdownMenuShortcut>⌘+P</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Plus />
                <span>Add Activity</span>
                <DropdownMenuShortcut>⌘+A</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
