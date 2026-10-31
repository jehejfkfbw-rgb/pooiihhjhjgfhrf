import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { knowledge } from "@/db/schema";
import { ensureSeeded } from "@/lib/seed";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureSeeded();
  const rows = await db.select().from(knowledge).orderBy(desc(knowledge.priority), desc(knowledge.id));
  return NextResponse.json({ ok: true, knowledge: rows });
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    category?: string; patterns?: string[]; answer?: string; active?: boolean; priority?: number;
  };
  const patterns = (body.patterns ?? []).map((p) => p.trim()).filter(Boolean).slice(0, 40);
  const answer = (body.answer ?? "").trim();
  if (!patterns.length || !answer) {
    return NextResponse.json({ ok: false, error: "لازم نمط واحد على الأقل + إجابة" }, { status: 400 });
  }
  const [row] = await db.insert(knowledge).values({
    category: (body.category ?? "عام").slice(0, 60),
    patterns,
    answer,
    active: body.active !== false,
    priority: Math.min(10, Math.max(0, body.priority ?? 1)),
  }).returning();
  return NextResponse.json({ ok: true, item: row });
}
