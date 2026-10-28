import { NextResponse } from "next/server";
import { db } from "@/db";
import { staff } from "@/db/schema";
import { isAdmin } from "@/lib/auth";
import { hashPassword } from "@/lib/staff";

// المطور/المدير فقط هو من ينشئ حسابات الموظفين
export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  const body = await req.json();
  const name = String(body.name ?? "").trim();
  const username = String(body.username ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const role = ["cs", "marketing", "dev"].includes(String(body.role))
    ? String(body.role)
    : "cs";
  const title = String(body.title ?? "").trim();

  if (name.length < 2) {
    return NextResponse.json({ error: "اسم الموظف مطلوب" }, { status: 400 });
  }
  if (!/^[a-z0-9_.]{3,30}$/.test(username)) {
    return NextResponse.json(
      { error: "اسم المستخدم بحروف إنجليزية/أرقام فقط (3-30 حرفاً)" },
      { status: 400 },
    );
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "كلمة المرور 6 أحرف على الأقل" }, { status: 400 });
  }

  try {
    const [row] = await db
      .insert(staff)
      .values({
        name,
        username,
        passwordHash: hashPassword(password),
        role,
        title: title || null,
      })
      .returning({ id: staff.id });
    return NextResponse.json({ ok: true, id: row.id });
  } catch {
    return NextResponse.json({ error: "اسم المستخدم مستخدم بالفعل" }, { status: 409 });
  }
}
