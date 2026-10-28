import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { csDirectives } from "@/db/schema";
import { isAdmin } from "@/lib/auth";

// تفعيل / إيقاف / حذف أمر عمل لخدمة العملاء
export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const directiveId = Number(id);
  if (!Number.isFinite(directiveId)) {
    return NextResponse.json({ error: "معرّف غير صالح" }, { status: 400 });
  }
  const body = await req.json();
  const action = String(body.action ?? "");

  if (action === "delete") {
    const [row] = await db
      .delete(csDirectives)
      .where(eq(csDirectives.id, directiveId))
      .returning({ id: csDirectives.id });
    if (!row) {
      return NextResponse.json({ error: "الأمر غير موجود" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  }

  const status = action === "activate" ? "active" : action === "pause" ? "paused" : null;
  if (!status) {
    return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 });
  }
  const [row] = await db
    .update(csDirectives)
    .set({ status })
    .where(eq(csDirectives.id, directiveId))
    .returning({ id: csDirectives.id });
  if (!row) {
    return NextResponse.json({ error: "الأمر غير موجود" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
