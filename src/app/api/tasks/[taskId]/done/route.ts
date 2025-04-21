import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/schema";
import { tasks } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  context: { params: { taskId: string } }
) {
  const params = context.params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const taskId = parseInt(params.taskId, 10);

  if (isNaN(taskId)) {
    return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
  }

  try {
    // Update the task to set is_done = true
    const result = await db
      .update(tasks)
      .set({ is_done: true })
      .where(and(eq(tasks.id, taskId), eq(tasks.user_id, userId)))
      .returning({ updatedId: tasks.id }); // Return the ID to confirm update

    if (result.length === 0) {
      // This could mean the task doesn't exist or doesn't belong to the user
      return NextResponse.json(
        { error: "Task not found or not authorized" },
        { status: 404 }
      );
    }

    console.log(`Task ${taskId} marked as done for user ${userId}`);
    return NextResponse.json({ success: true, taskId: result[0].updatedId });
  } catch (error) {
    console.error(`Error marking task ${taskId} as done:`, error);
    return NextResponse.json(
      { error: "Failed to mark task as done" },
      { status: 500 }
    );
  }
}
