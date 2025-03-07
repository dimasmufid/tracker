import Stopwatch from "@/components/Stopwatch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { db } from "@/db/schema";
import * as schema from "@/db/schema";

export default async function Home() {
  const tasks = await db.select().from(schema.tasks);

  return (
    <main className="flex min-h-screen flex-row">
      <div className="w-1/2 p-6 border-r">
        <Stopwatch />
      </div>
      <div className="w-1/2 p-6">
        <Tabs defaultValue="tasks">
          <TabsList>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
          </TabsList>
          <TabsContent value="tasks">
            {tasks.map((task) => (
              <div key={task.id}>{task.name}</div>
            ))}
          </TabsContent>
          <TabsContent value="projects">Projects</TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
