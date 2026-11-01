import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { knowledge } from "@/db/schema";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await db.select().from(knowledge).orderBy(desc(knowledge.id));
    return NextResponse.json({ ok: true, knowledge: rows });
  } catch (err) {
    console.error("knowledge GET error", err);
    return NextResponse.json({ ok: true, knowledge: [], degraded: true });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const [row] = await db.insert(knowledge).values({
    category: body.category,
    patterns: body.patterns,
    answer: body.answer,
    priority: body.priority
  }).returning();
  return NextResponse.json({ ok: true, item: row });
}
