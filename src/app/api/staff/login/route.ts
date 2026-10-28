import { NextResponse } from "next/server";
import { STAFF_COOKIE, createStaffToken } from "@/lib/auth";
import { ensureDefaultStaff, findStaffByUsername, verifyPassword } from "@/lib/staff";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const username = String(body.username ?? "");
    const password = String(body.password ?? "");
    if (!username || !password) {
      return NextResponse.json({ error: "أدخل اسم المستخدم وكلمة المرور" }, { status: 400 });
    }

    await ensureDefaultStaff();
    const user = await findStaffByUsername(username);

    if (!user || !user.active || !verifyPassword(password, user.passwordHash)) {
      await new Promise((r) => setTimeout(r, 800));
      return NextResponse.json(
        { error: "بيانات الموظف غير صحيحة أو الحساب موقوف" },
        { status: 401 },
      );
    }

    const res = NextResponse.json({ ok: true, name: user.name });
    res.cookies.set(STAFF_COOKIE, createStaffToken(user.id), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 12,
      path: "/",
    });
    return res;
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
}
