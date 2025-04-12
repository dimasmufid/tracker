"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { ActivityFormValues, activityFormSchema } from "@/lib/schemas";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { Trash2 } from "lucide-react";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { deleteActivity } from "@/lib/actions";
import { getCurrentUserId } from "@/lib/auth";

const formSchema = activityFormSchema.omit({ user_id: true });

type Activity = {
  id: number;
  name: string;
};

interface ActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity: Activity | null;
  onSaveActivity: (
    activity: Activity | null,
    data: ActivityFormValues
  ) => Promise<void>;
  mode: "add" | "edit";
  onActivityDeleted?: () => void;
}

export function ActivityDialog({
  open,
  onOpenChange,
  activity,
  onSaveActivity,
  mode,
  onActivityDeleted,
}: ActivityDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: activity?.name || "",
    },
  });

  // Update form values when activity changes
  useEffect(() => {
    if (activity && mode === "edit") {
      form.reset({
        name: activity.name,
      });
    } else if (mode === "add") {
      form.reset({
        name: "",
      });
    }
  }, [activity, form, mode]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true);

      // Get the user ID using the utility function
      const userId = await getCurrentUserId();

      // Add user_id to the form values
      const formData: ActivityFormValues = {
        ...values,
        user_id: userId,
      };

      await onSaveActivity(activity, formData);
      onOpenChange(false);
      toast({
        title: `Activity ${mode === "add" ? "created" : "updated"}`,
        description: `Your activity has been ${
          mode === "add" ? "created" : "updated"
        } successfully.`,
      });
    } catch (error) {
      console.error(
        `Error ${mode === "add" ? "creating" : "updating"} activity:`,
        error
      );
      toast({
        title: "Error",
        description: `Failed to ${
          mode === "add" ? "create" : "update"
        } activity. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleDeleteActivity = async () => {
    if (!activity) return;

    try {
      setIsDeleting(true);
      await deleteActivity(activity.id);

      // Close both dialogs
      setIsDeleteDialogOpen(false);
      onOpenChange(false);

      // Notify parent component
      if (onActivityDeleted) {
        onActivityDeleted();
      }

      toast({
        title: "Activity deleted",
        description: "The activity has been deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting activity:", error);
      toast({
        title: "Error",
        description: "Failed to delete activity. Please try again.",
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
              {mode === "add" ? "Add New Activity" : "Edit Activity"}
            </DialogTitle>
            <DialogDescription>
              {mode === "add"
                ? "Create a new activity type for your tasks."
                : "Make changes to your activity details."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Activity Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter activity name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="flex justify-between items-center">
                {mode === "edit" && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-full border-destructive text-destructive hover:bg-destructive/10"
                    onClick={() => setIsDeleteDialogOpen(true)}
                    disabled={isSubmitting}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                <div
                  className={mode === "edit" ? "flex-1 flex justify-end" : ""}
                >
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting
                      ? mode === "add"
                        ? "Creating..."
                        : "Saving..."
                      : mode === "add"
                      ? "Create Activity"
                      : "Save Changes"}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Activity"
        description="Are you sure you want to delete this activity? This action cannot be undone and will also delete all tasks associated with this activity."
        onConfirm={handleDeleteActivity}
        isDeleting={isDeleting}
      />
    </>
  );
}
