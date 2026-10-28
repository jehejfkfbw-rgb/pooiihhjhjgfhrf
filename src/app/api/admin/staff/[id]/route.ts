import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { staff } from "@/db/schema";
import { isAdmin } from "@/lib/auth";
import { hashPassword } from "@/lib/staff";

// إيقاف/تنشيط حساب أو تغيير كلمة المرور — للمدير فقط
export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const staffId = Number(id);
  if (!Number.isFinite(staffId)) {
    return NextResponse.json({ error: "معرّف غير صالح" }, { status: 400 });
  }
  const body = await req.json();

  if (body.action === "toggle") {
    const [row] = await db
      .select({ active: staff.active })
      .from(staff)
      .where(eq(staff.id, staffId))
      .limit(1);
    if (!row) return NextResponse.json({ error: "الموظف غير موجود" }, { status: 404 });
    await db
      .update(staff)
      .set({ active: !row.active })
      .where(eq(staff.id, staffId));
    return NextResponse.json({ ok: true });
  }

  if (body.action === "password") {
    const password = String(body.password ?? "");
    if (password.length < 6) {
      return NextResponse.json({ error: "كلمة المرور 6 أحرف على الأقل" }, { status: 400 });
    }
    await db
      .update(staff)
      .set({ passwordHash: hashPassword(password) })
      .where(eq(staff.id, staffId));
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 });
}
