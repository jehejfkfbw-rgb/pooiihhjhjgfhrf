import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { knowledge } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as {
    category?: string; patterns?: string[]; answer?: string; active?: boolean; priority?: number;
  };
  const patch: Record<string, unknown> = {};
  if (typeof body.category === "string") patch.category = body.category.slice(0, 60);
  if (Array.isArray(body.patterns)) patch.patterns = body.patterns.map((p) => String(p).trim()).filter(Boolean).slice(0, 40);
  if (typeof body.answer === "string") patch.answer = body.answer;
  if (typeof body.active === "boolean") patch.active = body.active;
  if (typeof body.priority === "number") patch.priority = Math.min(10, Math.max(0, body.priority));
  if (!Object.keys(patch).length) return NextResponse.json({ ok: false }, { status: 400 });

  const [row] = await db.update(knowledge).set(patch).where(eq(knowledge.id, Number(id))).returning();
  return NextResponse.json({ ok: true, item: row });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  await db.delete(knowledge).where(eq(knowledge.id, Number(id)));
  return NextResponse.json({ ok: true });
}
