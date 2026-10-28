import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import {
  projects,
  projectTasks,
  projectTestResults,
  modelUsage,
} from "@/db/schema";
import { isAdmin } from "@/lib/auth";
import { reconcileStale } from "@/lib/nebras/engine";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  await reconcileStale();

  const [projAgg, taskAgg, testAgg, usageAgg, taskByRole] = await Promise.all([
    db
      .select({
        total: sql<number>`count(*)`,
        running: sql<number>`count(*) filter (where status = 'running')`,
        paused: sql<number>`count(*) filter (where status = 'paused')`,
        blocked: sql<number>`count(*) filter (where status = 'blocked' or status = 'failed')`,
        delivered: sql<number>`count(*) filter (where status = 'delivered')`,
        inProgress: sql<number>`count(*) filter (where status in ('intake','needs_info','awaiting_confirm','planned'))`,
        avgProgress: sql<number>`coalesce(avg(progress),0)`,
      })
      .from(projects),
    db
      .select({
        total: sql<number>`count(*)`,
        done: sql<number>`count(*) filter (where status = 'done')`,
        failed: sql<number>`count(*) filter (where status = 'failed')`,
        queued: sql<number>`count(*) filter (where status in ('queued','running'))`,
      })
      .from(projectTasks),
    db
      .select({
        total: sql<number>`count(*)`,
        pass: sql<number>`count(*) filter (where status = 'pass')`,
        fail: sql<number>`count(*) filter (where status = 'fail' or status = 'error')`,
      })
      .from(projectTestResults),
    db
      .select({
        calls: sql<number>`count(*)`,
        ok: sql<number>`count(*) filter (where "ok")`,
        promptChars: sql<number>`coalesce(sum("prompt_chars"),0)`,
        completionChars: sql<number>`coalesce(sum("completion_chars"),0)`,
        costMicro: sql<number | null>`sum(cost_usd)`,
      })
      .from(modelUsage),
    db
      .select({
        role: projectTasks.agentRole,
        done: sql<number>`count(*) filter (where status = 'done')`,
        failed: sql<number>`count(*) filter (where status = 'failed')`,
        total: sql<number>`count(*)`,
      })
      .from(projectTasks)
      .groupBy(projectTasks.agentRole),
  ]);

  const p = projAgg[0];
  const t = taskAgg[0];
  const tt = testAgg[0];
  const u = usageAgg[0];

  return NextResponse.json({
    projects: {
      total: p.total,
      running: p.running,
      paused: p.paused,
      blocked: p.blocked,
      delivered: p.delivered,
      inProgress: p.inProgress,
      avgProgress: Math.round(p.avgProgress),
    },
    tasks: {
      total: t.total,
      done: t.done,
      failed: t.failed,
      queued: t.queued,
      successRate: t.total ? Math.round((t.done / t.total) * 100) : null,
    },
    tests: {
      total: tt.total,
      pass: tt.pass,
      fail: tt.fail,
      passRate: tt.total ? Math.round((tt.pass / tt.total) * 100) : null,
    },
    usage: {
      calls: u.calls,
      ok: u.ok,
      promptChars: u.promptChars,
      completionChars: u.completionChars,
      costUsd: u.costMicro != null ? u.costMicro / 1_000_000 : null,
    },
    byRole: taskByRole,
  });
}
