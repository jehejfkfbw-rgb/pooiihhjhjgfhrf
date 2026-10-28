import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { projects, projectFeedback, projectEvents } from "@/db/schema";

export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.code, code.trim().toUpperCase()))
    .limit(1);
  if (!project) {
    return NextResponse.json({ error: "رمز المتابعة غير صحيح" }, { status: 404 });
  }
  if (project.status !== "delivered") {
    return NextResponse.json({ error: "التقييم متاح بعد التسليم" }, { status: 400 });
  }
  const existing = await db
    .select()
    .from(projectFeedback)
    .where(eq(projectFeedback.projectId, project.id))
    .limit(1);
  if (existing.length) {
    return NextResponse.json({ error: "أرسلت تقييمك مسبقاً" }, { status: 400 });
  }
  const body = await req.json();
  const rating = Math.max(1, Math.min(5, Math.round(Number(body.rating) || 0)));
  const comment = String(body.comment ?? "").trim().slice(0, 1000);
  const hasIssue = Boolean(body.hasIssue);
  if (!rating) {
    return NextResponse.json({ error: "اختر تقييم من 1 إلى 5" }, { status: 400 });
  }
  await db.insert(projectFeedback).values({ projectId: project.id, rating, comment: comment || null, hasIssue });
  await db.insert(projectEvents).values({
    projectId: project.id,
    kind: "feedback",
    actor: "العميل",
    message: `تقييم العميل: ${rating}/5${hasIssue ? " — أبلغ عن مشكلة" : ""}${comment ? ` — ${comment.slice(0, 160)}` : ""}`,
  });
  return NextResponse.json({ ok: true });
}
