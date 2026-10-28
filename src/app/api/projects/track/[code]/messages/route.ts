import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { projects, clientMessages, projectEvents } from "@/db/schema";

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
  const body = await req.json();
  const content = String(body.content ?? "").trim().slice(0, 2000);
  if (content.length < 3) {
    return NextResponse.json({ error: "الرسالة قصيرة جداً" }, { status: 400 });
  }
  await db.insert(clientMessages).values({ projectId: project.id, sender: "client", content });
  await db.insert(projectEvents).values({
    projectId: project.id,
    kind: "message",
    actor: "العميل",
    message: `رسالة جديدة من العميل: ${content.slice(0, 160)}`,
  });
  return NextResponse.json({ ok: true });
}
