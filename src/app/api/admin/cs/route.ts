import { NextResponse } from "next/server";
import { db } from "@/db";
import { csDirectives } from "@/db/schema";
import { isAdmin } from "@/lib/auth";

// إصدار أمر عمل لفريق خدمة العملاء (ليلى/فهد/كلاهما)
export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  const body = await req.json();
  const target = String(body.target ?? "both");
  const title = String(body.title ?? "").trim().slice(0, 200);
  const content = String(body.content ?? "").trim().slice(0, 2000);

  if (!["laila", "fahd", "both"].includes(target)) {
    return NextResponse.json({ error: "جهة الاستلام غير صالحة" }, { status: 400 });
  }
  if (!title || !content) {
    return NextResponse.json(
      { error: "اكتب عنوان الأمر ونص التوجيه" },
      { status: 400 },
    );
  }

  const [row] = await db
    .insert(csDirectives)
    .values({ target, title, content, status: "active" })
    .returning({ id: csDirectives.id });

  return NextResponse.json({ ok: true, id: row.id });
}
