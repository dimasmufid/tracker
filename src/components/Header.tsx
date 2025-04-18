"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  LineChart,
  MoreVertical,
  CalendarIcon,
  FolderIcon,
  TagIcon,
  PlusCircleIcon,
  PencilIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { DropdownDay } from "@/components/DropdownDay";
import { ProjectDialog } from "@/components/ProjectDialog";
import { ActivityDialog } from "@/components/ActivityDialog";
import { ProjectFormValues, ActivityFormValues } from "@/lib/schemas";
import { Logo } from "@/components/Logo";
import { UserMenu } from "@/components/user-menu";

type Project = {
  id: number;
  name: string;
  description?: string;
  color: string;
  created_at: number;
};

type Activity = {
  id: number;
  name: string;
};

interface HeaderProps {
  projects: Project[];
  activities: Activity[];
  onAddProject: (data: ProjectFormValues) => Promise<void>;
  onEditProject: (projectId: number, data: ProjectFormValues) => Promise<void>;
  onAddActivity: (data: ActivityFormValues) => Promise<void>;
  onEditActivity: (
    activityId: number,
    data: ActivityFormValues
  ) => Promise<void>;
  onDateChange: (date: Date) => void;
  selectedDate?: Date;
  onProjectDeleted?: (projectId: number) => void;
  onActivityDeleted?: (activityId: number) => void;
}

export default function Header({
  projects = [],
  activities = [],
  onAddProject,
  onEditProject,
  onAddActivity,
  onEditActivity,
  onDateChange,
  selectedDate,
  onProjectDeleted,
  onActivityDeleted,
}: HeaderProps) {
  const router = useRouter();

  // Project dialog state
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [projectDialogMode, setProjectDialogMode] = useState<"add" | "edit">(
    "add"
  );
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Activity dialog state
  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false);
  const [activityDialogMode, setActivityDialogMode] = useState<"add" | "edit">(
    "add"
  );
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(
    null
  );

  // Handle opening project dialog
  const handleOpenProjectDialog = (
    mode: "add" | "edit",
    project: Project | null = null
  ) => {
    setProjectDialogMode(mode);
    setSelectedProject(project);
    setIsProjectDialogOpen(true);
  };

  // Handle opening activity dialog
  const handleOpenActivityDialog = (
    mode: "add" | "edit",
    activity: Activity | null = null
  ) => {
    setActivityDialogMode(mode);
    setSelectedActivity(activity);
    setIsActivityDialogOpen(true);
  };

  // Handle saving project
  const handleSaveProject = async (
    project: Project | null,
    data: ProjectFormValues
  ) => {
    console.log(
      "handleSaveProject called with project:",
      project,
      "data:",
      data
    );
    try {
      if (projectDialogMode === "add") {
        console.log("Adding new project with data:", data);
        await onAddProject(data);
        console.log("Project added successfully");
      } else {
        if (project) {
          console.log("Editing project with ID:", project.id, "data:", data);
          await onEditProject(project.id, data);
          console.log("Project edited successfully");
        }
      }
    } catch (error) {
      console.error("Error in handleSaveProject:", error);
      throw error; // Re-throw to allow the dialog to handle the error
    }
  };

  // Handle saving activity
  const handleSaveActivity = async (
    activity: Activity | null,
    data: ActivityFormValues
  ) => {
    if (activityDialogMode === "add") {
      await onAddActivity(data);
    } else {
      if (activity) {
        await onEditActivity(activity.id, data);
      }
    }
  };

  // Handle project deletion
  const handleProjectDeleted = () => {
    if (selectedProject && onProjectDeleted) {
      onProjectDeleted(selectedProject.id);
    }
  };

  // Handle activity deletion
  const handleActivityDeleted = () => {
    if (selectedActivity && onActivityDeleted) {
      onActivityDeleted(selectedActivity.id);
    }
  };

  return (
    <div
      className={`w-full flex flex-row justify-between items-center px-3 py-2 md:px-4 overflow-hidden ${
        projects.length === 0 ? "bg-secondary" : "bg-[hsl(var(--primary))]/10"
      }`}
    >
      <div className="container mx-auto max-w-7xl flex justify-between items-center">
        {/* logo */}
        <Logo size="sm" className="md:hidden" />
        <Logo size="md" className="hidden md:flex" />

        {/* main actions */}
        <div className="flex flex-row items-center gap-1 sm:gap-2">
          {/* Date picker - hidden on mobile */}
          <div className="hidden sm:block">
            <DropdownDay
              selectedDate={selectedDate}
              onDateChange={onDateChange}
              className="hidden sm:flex"
            />
          </div>

          {/* User menu */}
          <UserMenu />

          {/* More options dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="ml-auto">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {/* Show date picker on mobile */}
              <div className="sm:hidden px-2 py-1.5">
                <DropdownDay
                  selectedDate={selectedDate}
                  onDateChange={onDateChange}
                  className="sm:hidden w-full"
                />
              </div>
              <div className="sm:hidden">
                <DropdownMenuSeparator />
              </div>

              <DropdownMenuLabel>Navigation</DropdownMenuLabel>
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() => router.push("/dashboard")}
                  disabled
                >
                  <LineChart className="w-4 h-4 mr-2" />
                  <span>Dashboard</span>
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  <span>Calendar</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />
              <DropdownMenuLabel>Manage</DropdownMenuLabel>

              {/* Projects submenu */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <FolderIcon className="w-4 h-4 mr-2" />
                  <span>Projects</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-56">
                  <DropdownMenuItem
                    onClick={() => handleOpenProjectDialog("add")}
                  >
                    <PlusCircleIcon className="w-4 h-4 mr-2" />
                    <span>Add Project</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {projects.length > 0 ? (
                    projects.map((project) => (
                      <DropdownMenuItem
                        key={project.id}
                        onClick={() => handleOpenProjectDialog("edit", project)}
                        className="py-2"
                      >
                        <div className="flex items-center w-full">
                          <span
                            className="h-4 w-4 rounded-full mr-2 flex-shrink-0"
                            style={{
                              backgroundColor: project.color,
                              boxShadow: `0 0 0 1px rgba(0,0,0,0.1)`,
                            }}
                          />
                          <span className="flex-grow truncate">
                            {project.name}
                          </span>
                        </div>
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <DropdownMenuItem disabled>
                      <span className="text-muted-foreground">
                        No projects available
                      </span>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              {/* Activities submenu */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <TagIcon className="w-4 h-4 mr-2" />
                  <span>Activities</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-56">
                  <DropdownMenuItem
                    onClick={() => handleOpenActivityDialog("add")}
                  >
                    <PlusCircleIcon className="w-4 h-4 mr-2" />
                    <span>Add Activity</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {activities.length > 0 ? (
                    activities.map((activity) => (
                      <DropdownMenuItem
                        key={activity.id}
                        onClick={() =>
                          handleOpenActivityDialog("edit", activity)
                        }
                      >
                        <div className="flex items-center w-full">
                          <span className="flex-grow truncate">
                            {activity.name}
                          </span>
                          <PencilIcon className="w-3 h-3 ml-2 text-muted-foreground" />
                        </div>
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <DropdownMenuItem disabled>
                      <span className="text-muted-foreground">
                        No activities available
                      </span>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Project Dialog */}
      <ProjectDialog
        open={isProjectDialogOpen}
        onOpenChange={setIsProjectDialogOpen}
        project={selectedProject}
        onSaveProject={handleSaveProject}
        mode={projectDialogMode}
        onProjectDeleted={handleProjectDeleted}
      />

      {/* Activity Dialog */}
      <ActivityDialog
        open={isActivityDialogOpen}
        onOpenChange={setIsActivityDialogOpen}
        activity={selectedActivity}
        onSaveActivity={handleSaveActivity}
        mode={activityDialogMode}
        onActivityDeleted={handleActivityDeleted}
      />
    </div>
  );
}
