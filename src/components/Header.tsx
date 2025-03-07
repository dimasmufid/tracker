"use client";

import { useState } from "react";
import {
  LineChart,
  MoreVertical,
  TimerResetIcon,
  CalendarIcon,
  SettingsIcon,
  FolderIcon,
  TagIcon,
  PlusCircleIcon,
  PencilIcon,
} from "lucide-react";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DropdownDay } from "./DropdownDay";
import { ProjectDialog } from "./ProjectDialog";
import { ActivityDialog } from "./ActivityDialog";
import * as z from "zod";

type Project = {
  id: number;
  name: string;
  description?: string;
  color: string;
  createdAt: number;
};

type Activity = {
  id: number;
  name: string;
};

interface HeaderProps {
  projects: Project[];
  activities: Activity[];
  onAddProject: (data: z.infer<typeof projectFormSchema>) => Promise<void>;
  onEditProject: (
    projectId: number,
    data: z.infer<typeof projectFormSchema>
  ) => Promise<void>;
  onAddActivity: (data: z.infer<typeof activityFormSchema>) => Promise<void>;
  onEditActivity: (
    activityId: number,
    data: z.infer<typeof activityFormSchema>
  ) => Promise<void>;
}

// Form schemas
const projectFormSchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().optional(),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
});

const activityFormSchema = z.object({
  name: z.string().min(2).max(50),
});

export default function Header({
  projects = [],
  activities = [],
  onAddProject,
  onEditProject,
  onAddActivity,
  onEditActivity,
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
    data: z.infer<typeof projectFormSchema>
  ) => {
    if (projectDialogMode === "add") {
      await onAddProject(data);
    } else {
      if (project) {
        await onEditProject(project.id, data);
      }
    }
  };

  // Handle saving activity
  const handleSaveActivity = async (
    activity: Activity | null,
    data: z.infer<typeof activityFormSchema>
  ) => {
    if (activityDialogMode === "add") {
      await onAddActivity(data);
    } else {
      if (activity) {
        await onEditActivity(activity.id, data);
      }
    }
  };

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
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Navigation</DropdownMenuLabel>
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
                      >
                        <div className="flex items-center w-full">
                          <span
                            className="h-3 w-3 rounded-full mr-2 flex-shrink-0"
                            style={{ backgroundColor: project.color }}
                          />
                          <span className="flex-grow truncate">
                            {project.name}
                          </span>
                          <PencilIcon className="w-3 h-3 ml-2 text-muted-foreground" />
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

              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <SettingsIcon className="w-4 h-4 mr-2" />
                <span>Settings</span>
              </DropdownMenuItem>
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
      />

      {/* Activity Dialog */}
      <ActivityDialog
        open={isActivityDialogOpen}
        onOpenChange={setIsActivityDialogOpen}
        activity={selectedActivity}
        onSaveActivity={handleSaveActivity}
        mode={activityDialogMode}
      />
    </div>
  );
}
