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
  const [colorPreview, setColorPreview] = useState(project?.color || "#3b82f6");

  const form: UseFormReturn<ProjectFormValues> = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: project?.name || "",
      description: project?.description || "",
      color: project?.color || "#3b82f6",
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
      setColorPreview(project.color);
    } else if (mode === "add") {
      form.reset({
        name: "",
        description: "",
        color: "#3b82f6",
      });
      setColorPreview("#3b82f6");
    }
  }, [project, form, mode]);

  // Update color preview when color field changes
  useEffect(() => {
    const subscription = form.watch((value) => {
      const color = value.color;
      if (color) {
        setColorPreview(color);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

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
                  <div className="flex items-center gap-3">
                    <FormControl>
                      <Input placeholder="#3b82f6" {...field} />
                    </FormControl>
                    <div
                      className="w-10 h-10 rounded-full border border-border flex-shrink-0"
                      style={{ backgroundColor: colorPreview }}
                    />
                  </div>
                  <FormDescription>
                    Enter a hex color code (e.g., #3b82f6)
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
