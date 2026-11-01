import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { staff } from "@/db/schema";
import { ensureSeeded } from "@/lib/seed";
import { asc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureSeeded();
  const rows = await db.select().from(staff).orderBy(asc(staff.id));
  return NextResponse.json({ ok: true, staff: rows });
}

export async function PUT(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { id?: number; online?: boolean; name?: string; role?: string; dept?: string };
  if (!body.id) return NextResponse.json({ ok: false }, { status: 400 });
  const patch: Record<string, unknown> = {};
  if (typeof body.online === "boolean") patch.online = body.online;
  if (typeof body.name === "string") patch.name = body.name.slice(0, 80);
  if (typeof body.role === "string") patch.role = body.role.slice(0, 120);
  if (typeof body.dept === "string") patch.dept = body.dept.slice(0, 60);
  if (!Object.keys(patch).length) return NextResponse.json({ ok: false }, { status: 400 });
  const [row] = await db.update(staff).set(patch).where(eq(staff.id, body.id)).returning();
  return NextResponse.json({ ok: true, member: row });
}
