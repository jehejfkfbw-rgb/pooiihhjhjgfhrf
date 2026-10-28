import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { projects, projectTasks } from "@/db/schema";
import { isAdmin } from "@/lib/auth";
import { reconcileStale } from "@/lib/nebras/engine";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  await reconcileStale();
  const [rows, allTasks] = await Promise.all([
    db.select().from(projects).orderBy(desc(projects.createdAt)).limit(100),
    db.select().from(projectTasks).limit(2000),
  ]);
  const withCounts = rows.map((p) => {
    const mine = allTasks.filter((x) => x.projectId === p.id);
    const done = mine.filter((x) => x.status === "done").length;
    const failed = mine.filter((x) => x.status === "failed").length;
    return {
      id: p.id,
      code: p.code,
      title: p.title,
      clientName: p.clientName,
      type: p.serviceType,
      status: p.status,
      priority: p.priority,
      progress: p.progress,
      eta: p.deliveryEta,
      etaConfidence: p.etaConfidence,
      createdAt: p.createdAt.toISOString(),
      tasksTotal: mine.length,
      tasksDone: done,
      tasksFailed: failed,
    };
  });
  return NextResponse.json({ projects: withCounts });
}
