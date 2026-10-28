import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import {
  projects,
  projectTasks,
  projectEvents,
  projectFiles,
  projectTestResults,
  deliveryEstimates,
  clientMessages,
  projectFeedback,
  projectRequirements,
} from "@/db/schema";

// صفحة العميل: بياناته فقط عبر رمز متابعته (لا وصول لمشاريع الآخرين)
export async function GET(_req: Request, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.code, code.trim().toUpperCase()))
    .limit(1);
  if (!project) {
    return NextResponse.json({ error: "رمز المتابعة غير صحيح" }, { status: 404 });
  }

  const [tasks, events, files, tests, estimates, messages, feedbacks, reqs] = await Promise.all([
    db.select().from(projectTasks).where(eq(projectTasks.projectId, project.id)).orderBy(projectTasks.seq),
    db.select().from(projectEvents).where(eq(projectEvents.projectId, project.id)).orderBy(desc(projectEvents.createdAt)).limit(40),
    db.select().from(projectFiles).where(eq(projectFiles.projectId, project.id)).orderBy(projectFiles.path),
    db.select().from(projectTestResults).where(eq(projectTestResults.projectId, project.id)).orderBy(desc(projectTestResults.createdAt)).limit(100),
    db.select().from(deliveryEstimates).where(eq(deliveryEstimates.projectId, project.id)).orderBy(desc(deliveryEstimates.createdAt)).limit(10),
    db.select().from(clientMessages).where(eq(clientMessages.projectId, project.id)).orderBy(desc(clientMessages.createdAt)).limit(100),
    db.select().from(projectFeedback).where(eq(projectFeedback.projectId, project.id)).orderBy(desc(projectFeedback.createdAt)).limit(5),
    db.select().from(projectRequirements).where(eq(projectRequirements.projectId, project.id)).orderBy(desc(projectRequirements.version)).limit(3),
  ]);

  const delivered = project.status === "delivered";
  const failCount = tests.filter((t) => t.status === "fail" || t.status === "error").length;
  const passCount = tests.filter((t) => t.status === "pass").length;

  return NextResponse.json({
    project: {
      code: project.code,
      title: project.title,
      type: project.serviceType,
      status: project.status,
      priority: project.priority,
      deadlineWish: project.deadlineWish,
      progress: project.progress,
      eta: project.deliveryEta,
      etaConfidence: project.etaConfidence,
      estLowMin: project.estLowMin,
      estHighMin: project.estHighMin,
      feasibility: project.feasibility,
      missingInfo: project.missingInfo,
      scopeIn: project.scopeIn,
      scopeOut: project.scopeOut,
      createdAt: project.createdAt,
    },
    tasks: tasks.map((t) => ({
      title: t.title,
      status: t.status,
      agentName: t.agentName ?? t.agentRole,
      weightMin: t.weightMin,
    })),
    events: events.map((e) => ({
      kind: e.kind,
      actor: e.actor,
      message: e.message,
      at: e.createdAt,
    })),
    files: delivered
      ? files.map((f) => ({ path: f.path, size: f.size, version: f.version }))
      : [],
    testSummary: { pass: passCount, fail: failCount, total: passCount + failCount },
    estimates: estimates.map((e) => ({
      low: e.etaLow,
      high: e.etaHigh,
      confidence: e.confidence,
      basis: e.basis,
      at: e.createdAt,
    })),
    messages: messages
      .slice()
      .reverse()
      .map((m) => ({ sender: m.sender, content: m.content, at: m.createdAt })),
    requirements: reqs.slice(0, 1).map((r) => ({ version: r.version, content: r.content })),
    feedback: feedbacks.length
      ? {
          rating: feedbacks[0].rating,
          hasIssue: feedbacks[0].hasIssue,
          given: true,
        }
      : { given: false },
  });
}
