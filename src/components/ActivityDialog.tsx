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
}

export function ActivityDialog({
  open,
  onOpenChange,
  activity,
  onSaveActivity,
  mode,
}: ActivityDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      // Get the current user ID from the session
      const session = await fetch("/api/auth/session").then((res) =>
        res.json()
      );
      const userId = session?.user?.id;

      if (!userId) {
        throw new Error("User not authenticated");
      }

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

  return (
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
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? mode === "add"
                    ? "Creating..."
                    : "Saving..."
                  : mode === "add"
                  ? "Create Activity"
                  : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
