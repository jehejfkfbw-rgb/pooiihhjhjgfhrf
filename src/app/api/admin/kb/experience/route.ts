import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  projectDecisions,
  projectLessons,
  errorFixes,
  reusableComponents,
  projectEstimateRecords,
  projects,
} from "@/db/schema";
import { isAdmin } from "@/lib/auth";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  const [decisions, lessons, fixes, components, records] = await Promise.all([
    db.select().from(projectDecisions).orderBy(desc(projectDecisions.createdAt)).limit(20),
    db.select().from(projectLessons).orderBy(desc(projectLessons.createdAt)).limit(20),
    db.select().from(errorFixes).orderBy(desc(errorFixes.lastSeenAt)).limit(20),
    db.select().from(reusableComponents).orderBy(desc(reusableComponents.timesUsed)).limit(20),
    db
      .select({
        id: projectEstimateRecords.id,
        code: projects.code,
        serviceType: projectEstimateRecords.serviceType,
        estLowMin: projectEstimateRecords.estLowMin,
        estHighMin: projectEstimateRecords.estHighMin,
        actualSec: projectEstimateRecords.actualSec,
        taskCount: projectEstimateRecords.taskCount,
        at: projectEstimateRecords.createdAt,
      })
      .from(projectEstimateRecords)
      .innerJoin(projects, eq(projectEstimateRecords.projectId, projects.id))
      .orderBy(desc(projectEstimateRecords.createdAt))
      .limit(20),
  ]);

  // دقة التقدير حسب نوع الخدمة
  const byType: Record<string, { n: number; est: number; actual: number }> = {};
  for (const r of records) {
    byType[r.serviceType] ??= { n: 0, est: 0, actual: 0 };
    byType[r.serviceType].n++;
    byType[r.serviceType].est += r.estLowMin;
    byType[r.serviceType].actual += r.actualSec / 60;
  }
  const learning = Object.entries(byType).map(([type, v]) => ({
    type,
    n: v.n,
    avgEstMin: Math.round(v.est / v.n),
    avgActualMin: Math.round(v.actual / v.n),
    // نسبة الفعلي للمقدَّر — كلما اقتربت من 100% كانت المعايرة أدق
    deviation: v.est > 0 ? Math.round(((v.actual / v.n) / (v.est / v.n) - 1) * 100) : null,
  }));

  return NextResponse.json({
    decisions: decisions.map((d) => ({
      ...d,
      projectId: d.projectId,
      at: d.createdAt.toISOString(),
    })),
    lessons: lessons.map((l) => ({ ...l, at: l.createdAt.toISOString() })),
    fixes: fixes.map((f) => ({
      ...f,
      lastSeenAt: f.lastSeenAt.toISOString(),
    })),
    components: components.map((c) => ({ ...c, at: c.createdAt.toISOString() })),
    records: records.map((r) => ({
      ...r,
      at: r.at.toISOString(),
      code: r.code,
    })),
    learning,
  });
}
