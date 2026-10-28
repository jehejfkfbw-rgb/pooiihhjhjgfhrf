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
  approvals,
  modelUsage,
  projectNotes,
  projectRequirements,
  projectFeedback,
} from "@/db/schema";
import { isAdmin } from "@/lib/auth";
import { reconcileStale } from "@/lib/nebras/engine";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  await reconcileStale();
  const { id } = await ctx.params;
  const pid = Number(id);
  if (!Number.isFinite(pid)) {
    return NextResponse.json({ error: "معرّف غير صالح" }, { status: 400 });
  }
  const [project] = await db.select().from(projects).where(eq(projects.id, pid)).limit(1);
  if (!project) {
    return NextResponse.json({ error: "المشروع غير موجود" }, { status: 404 });
  }

  const [tasks, events, files, tests, estimates, messages, approvalsRows, usage, notes, reqs, feedbacks] =
    await Promise.all([
      db.select().from(projectTasks).where(eq(projectTasks.projectId, pid)).orderBy(projectTasks.seq),
      db.select().from(projectEvents).where(eq(projectEvents.projectId, pid)).orderBy(desc(projectEvents.createdAt)).limit(120),
      db.select().from(projectFiles).where(eq(projectFiles.projectId, pid)).orderBy(projectFiles.path),
      db.select().from(projectTestResults).where(eq(projectTestResults.projectId, pid)).orderBy(desc(projectTestResults.createdAt)).limit(200),
      db.select().from(deliveryEstimates).where(eq(deliveryEstimates.projectId, pid)).orderBy(desc(deliveryEstimates.createdAt)),
      db.select().from(clientMessages).where(eq(clientMessages.projectId, pid)).orderBy(desc(clientMessages.createdAt)).limit(100),
      db.select().from(approvals).where(eq(approvals.projectId, pid)).orderBy(desc(approvals.createdAt)),
      db.select().from(modelUsage).where(eq(modelUsage.projectId, pid)).orderBy(desc(modelUsage.createdAt)),
      db.select().from(projectNotes).where(eq(projectNotes.projectId, pid)).orderBy(desc(projectNotes.createdAt)).limit(20),
      db.select().from(projectRequirements).where(eq(projectRequirements.projectId, pid)).orderBy(desc(projectRequirements.version)).limit(5),
      db.select().from(projectFeedback).where(eq(projectFeedback.projectId, pid)).orderBy(desc(projectFeedback.createdAt)).limit(5),
    ]);

  return NextResponse.json({
    project: {
      ...project,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      deliveryEta: project.deliveryEta?.toISOString() ?? null,
    },
    tasks: tasks.map((t) => ({
      ...t,
      startedAt: t.startedAt?.toISOString() ?? null,
      finishedAt: t.finishedAt?.toISOString() ?? null,
      createdAt: t.createdAt.toISOString(),
    })),
    events: events
      .slice()
      .reverse()
      .map((e) => ({ ...e, createdAt: e.createdAt.toISOString() })),
    files: files.map((f) => ({
      path: f.path,
      size: f.size,
      version: f.version,
      action: f.action,
      updatedAt: f.updatedAt.toISOString(),
      content: f.content.slice(0, 40_000),
    })),
    tests: tests
      .slice()
      .reverse()
      .map((t) => ({ ...t, createdAt: t.createdAt.toISOString() })),
    estimates: estimates
      .slice()
      .reverse()
      .map((e) => ({
        low: e.etaLow?.toISOString() ?? null,
        high: e.etaHigh?.toISOString() ?? null,
        confidence: e.confidence,
        basis: e.basis,
        at: e.createdAt.toISOString(),
      })),
    messages: messages
      .slice()
      .reverse()
      .map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })),
    approvals: approvalsRows.map((a) => ({ ...a, createdAt: a.createdAt.toISOString() })),
    usage: usage.map((u) => ({
      roleKey: u.roleKey,
      provider: u.provider,
      model: u.model,
      ok: u.ok,
      promptChars: u.promptChars,
      completionChars: u.completionChars,
      durationMs: u.durationMs,
      costUsd: u.costUsd != null ? u.costUsd / 1_000_000 : null,
    })),
    notes,
    requirements: reqs.map((r) => ({
      version: r.version,
      content: r.content,
      at: r.createdAt.toISOString(),
    })),
    feedback: feedbacks.map((f) => ({
      rating: f.rating,
      comment: f.comment,
      hasIssue: f.hasIssue,
    })),
  });
}
