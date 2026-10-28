import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { assignments, staff } from "@/db/schema";
import { isAdmin } from "@/lib/auth";

// المطور/المدير يُسند العمل للموظف — والموظف ينفّذه في بوابته
export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  const body = await req.json();
  const staffId = Number(body.staffId);
  const orderId = body.orderId ? Number(body.orderId) : null;
  const title = String(body.title ?? "").trim();
  const instructions = String(body.instructions ?? "").trim();

  if (!Number.isFinite(staffId)) {
    return NextResponse.json({ error: "اختر الموظف المسؤول" }, { status: 400 });
  }
  if (title.length < 3) {
    return NextResponse.json({ error: "عنوان المهمة مطلوب" }, { status: 400 });
  }

  const [member] = await db
    .select({ id: staff.id, active: staff.active })
    .from(staff)
    .where(and(eq(staff.id, staffId)))
    .limit(1);
  if (!member || !member.active) {
    return NextResponse.json({ error: "الموظف غير موجود أو حسابه موقوف" }, { status: 404 });
  }

  const [row] = await db
    .insert(assignments)
    .values({
      staffId,
      orderId: orderId && Number.isFinite(orderId) ? orderId : null,
      title,
      instructions: instructions || null,
      status: "assigned",
    })
    .returning({ id: assignments.id });

  return NextResponse.json({ ok: true, id: row.id });
}
