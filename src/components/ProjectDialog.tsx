"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, UseFormReturn } from "react-hook-form";
import { ProjectFormValues, projectFormSchema } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "./ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { CheckIcon } from "lucide-react";

// Predefined color options similar to Chrome's group colors
const colorOptions = [
  { value: "#BF4040", label: "Red" },
  { value: "#E67E22", label: "Orange" },
  { value: "#F1C40F", label: "Yellow" },
  { value: "#2ECC71", label: "Green" },
  { value: "#3498DB", label: "Blue" },
  { value: "#9B59B6", label: "Purple" },
  { value: "#607D8B", label: "Gray" },
];

type Project = {
  id: number;
  name: string;
  description?: string;
  color: string;
  createdAt: number;
};

interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  onSaveProject: (
    project: Project | null,
    data: ProjectFormValues
  ) => Promise<void>;
  mode: "add" | "edit";
}

export function ProjectDialog({
  open,
  onOpenChange,
  project,
  onSaveProject,
  mode,
}: ProjectDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const defaultColor = project?.color || colorOptions[4].value; // Default to blue if no color is provided

  const form: UseFormReturn<ProjectFormValues> = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: project?.name || "",
      description: project?.description || "",
      color: project?.color || defaultColor,
    },
  });

  // Update form values when project changes
  useEffect(() => {
    if (project && mode === "edit") {
      form.reset({
        name: project.name,
        description: project.description || "",
        color: project.color,
      });
    } else if (mode === "add") {
      form.reset({
        name: "",
        description: "",
        color: defaultColor,
      });
    }
  }, [project, form, mode, defaultColor]);

  async function onSubmit(values: ProjectFormValues) {
    try {
      setIsSubmitting(true);
      await onSaveProject(project, values);
      onOpenChange(false);
      toast({
        title: `Project ${mode === "add" ? "created" : "updated"}`,
        description: `Your project has been ${
          mode === "add" ? "created" : "updated"
        } successfully.`,
      });
    } catch (error) {
      console.error(
        `Error ${mode === "add" ? "creating" : "updating"} project:`,
        error
      );
      toast({
        title: "Error",
        description: `Failed to ${
          mode === "add" ? "create" : "update"
        } project. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Add New Project" : "Edit Project"}
          </DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? "Create a new project to organize your tasks."
              : "Make changes to your project details."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter project name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter project description (optional)"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <div className="flex flex-wrap gap-3 py-2">
                      {colorOptions.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center transition-all border",
                            field.value === color.value
                              ? "ring-2 ring-offset-2 ring-primary scale-110"
                              : "hover:scale-110 border-border"
                          )}
                          style={{ backgroundColor: color.value }}
                          onClick={() => field.onChange(color.value)}
                          title={color.label}
                          aria-label={`Select ${color.label} color`}
                        >
                          {field.value === color.value && (
                            <CheckIcon className="h-5 w-5 text-white drop-shadow-sm" />
                          )}
                        </button>
                      ))}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Select a color for your project
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? mode === "add"
                    ? "Creating..."
                    : "Saving..."
                  : mode === "add"
                  ? "Create Project"
                  : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
