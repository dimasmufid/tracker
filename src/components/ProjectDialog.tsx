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
import { CheckIcon, Trash2 } from "lucide-react";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { deleteProject } from "@/lib/actions";

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
  created_at: number;
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
  onProjectDeleted?: () => void;
}

export function ProjectDialog({
  open,
  onOpenChange,
  project,
  onSaveProject,
  mode,
  onProjectDeleted,
}: ProjectDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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

  // Add debugging for form errors
  useEffect(() => {
    const subscription = form.watch(() => {
      console.log("Form values changed:", form.getValues());
      console.log("Form errors:", form.formState.errors);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  async function onSubmit(values: ProjectFormValues) {
    console.log("onSubmit called with values:", values);
    console.log("Form is valid:", form.formState.isValid);

    try {
      setIsSubmitting(true);

      // Remove the getCurrentUserId call and just pass the values
      const formData: ProjectFormValues = {
        ...values,
      };
      console.log("Form data:", formData);

      await onSaveProject(project, formData);
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

  const handleDeleteProject = async () => {
    if (!project) return;

    try {
      setIsDeleting(true);
      await deleteProject(project.id);

      // Close both dialogs
      setIsDeleteDialogOpen(false);
      onOpenChange(false);

      // Notify parent component
      if (onProjectDeleted) {
        onProjectDeleted();
      }

      toast({
        title: "Project deleted",
        description: "The project has been deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting project:", error);
      toast({
        title: "Error",
        description: "Failed to delete project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
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

          {/* Regular form for debugging */}
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Project Name</h3>
              <input
                type="text"
                id="debug-name"
                className="w-full p-2 border rounded-md"
                placeholder="Enter project name"
                defaultValue={form.getValues().name}
              />
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Description</h3>
              <textarea
                id="debug-description"
                className="w-full p-2 border rounded-md resize-none"
                placeholder="Enter project description (optional)"
                defaultValue={form.getValues().description || ""}
              />
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Color</h3>
              <div className="flex flex-wrap gap-3 py-2">
                {colorOptions.map((color) => {
                  const selectedColor = form.getValues().color;
                  return (
                    <button
                      key={color.value}
                      type="button"
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-all border",
                        selectedColor === color.value
                          ? "ring-2 ring-offset-2 ring-primary scale-110"
                          : "hover:scale-110 border-border"
                      )}
                      style={{ backgroundColor: color.value }}
                      onClick={() => {
                        form.setValue("color", color.value, {
                          shouldDirty: true,
                        });
                        form.trigger("color");
                      }}
                      title={color.label}
                      aria-label={`Select ${color.label} color`}
                    >
                      {selectedColor === color.value && (
                        <CheckIcon className="h-5 w-5 text-white drop-shadow-sm" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-between items-center pt-4">
              {mode === "edit" && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-full border-destructive text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    console.log("Delete button clicked");
                    setIsDeleteDialogOpen(true);
                  }}
                  disabled={isSubmitting}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <div className={mode === "edit" ? "flex-1 flex justify-end" : ""}>
                <Button
                  type="button"
                  disabled={isSubmitting}
                  onClick={async () => {
                    console.log("Debug submit button clicked");
                    try {
                      setIsSubmitting(true);

                      const nameInput = document.getElementById(
                        "debug-name"
                      ) as HTMLInputElement;
                      const descriptionInput = document.getElementById(
                        "debug-description"
                      ) as HTMLTextAreaElement;

                      const values = {
                        name: nameInput.value,
                        description: descriptionInput.value,
                        color: form.getValues().color,
                      };

                      console.log("Debug form values:", values);

                      // Remove the getCurrentUserId call and just pass the values
                      const formData: ProjectFormValues = {
                        ...values,
                      };
                      console.log("Form data:", formData);

                      await onSaveProject(project, formData);
                      onOpenChange(false);
                      toast({
                        title: `Project ${
                          mode === "add" ? "created" : "updated"
                        }`,
                        description: `Your project has been ${
                          mode === "add" ? "created" : "updated"
                        } successfully.`,
                      });
                    } catch (error) {
                      console.error(
                        `Error ${
                          mode === "add" ? "creating" : "updating"
                        } project:`,
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
                  }}
                >
                  {isSubmitting
                    ? mode === "add"
                      ? "Creating..."
                      : "Saving..."
                    : mode === "add"
                    ? "Create Project"
                    : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>

          {/* Original form (hidden for now) */}
          <div className="hidden">
            <Form {...form}>
              <form
                onSubmit={(e) => {
                  console.log("Form submit event triggered");
                  form.handleSubmit(onSubmit)(e);
                }}
                className="space-y-4"
              >
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
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Project"
        description="Are you sure you want to delete this project? This action cannot be undone and will also delete all tasks associated with this project."
        onConfirm={handleDeleteProject}
        isDeleting={isDeleting}
      />
    </>
  );
}
