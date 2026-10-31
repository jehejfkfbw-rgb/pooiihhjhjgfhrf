import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { aiDevs } from "@/db/schema";
import { ensureSeeded } from "@/lib/seed";
import { eq, asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureSeeded();
  const rows = await db.select().from(aiDevs).orderBy(asc(aiDevs.id));
  return NextResponse.json({ ok: true, devs: rows });
}

export async function PUT(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    id?: number; status?: string; mission?: string; xp?: number;
  };
  if (!body.id) return NextResponse.json({ ok: false }, { status: 400 });
  const patch: Record<string, unknown> = {};
  if (typeof body.status === "string" && ["online", "mission", "training", "offline"].includes(body.status)) {
    patch.status = body.status;
  }
  if (typeof body.mission === "string") patch.mission = body.mission.slice(0, 200);
  if (typeof body.xp === "number") patch.xp = Math.min(100, Math.max(0, body.xp));
  if (!Object.keys(patch).length) return NextResponse.json({ ok: false }, { status: 400 });

  const [row] = await db.update(aiDevs).set(patch).where(eq(aiDevs.id, body.id)).returning();
  return NextResponse.json({ ok: true, dev: row });
}
