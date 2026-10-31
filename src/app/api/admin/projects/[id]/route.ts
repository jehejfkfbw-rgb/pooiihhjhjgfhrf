import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const patch: Record<string, unknown> = {};
  const str = (k: string, max: number) => {
    if (typeof body[k] === "string") patch[k] = String(body[k]).slice(0, max);
  };
  str("title", 160); str("client", 160); str("type", 30); str("description", 600); str("tech", 200); str("year", 8);
  if (typeof body.status === "string" && ["ongoing", "done", "queued"].includes(body.status)) {
    patch.status = body.status;
    if (body.status === "done") patch.progress = 100;
  }
  if (typeof body.progress === "number") patch.progress = Math.min(100, Math.max(0, body.progress));
  if (typeof body.budget === "number") patch.budget = Math.max(0, body.budget);
  if (!Object.keys(patch).length) return NextResponse.json({ ok: false }, { status: 400 });

  const [row] = await db.update(projects).set(patch).where(eq(projects.id, Number(id))).returning();
  return NextResponse.json({ ok: true, project: row });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  await db.delete(projects).where(eq(projects.id, Number(id)));
  return NextResponse.json({ ok: true });
}
