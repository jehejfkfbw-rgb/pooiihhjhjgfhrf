import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { knowledgeEntries } from "@/db/schema";
import { isAdmin } from "@/lib/auth";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const entryId = Number(id);
  if (!Number.isFinite(entryId)) {
    return NextResponse.json({ error: "معرّف غير صالح" }, { status: 400 });
  }
  const body = await req.json();
  const action = String(body.action ?? "");

  if (action === "delete") {
    const [row] = await db
      .delete(knowledgeEntries)
      .where(eq(knowledgeEntries.id, entryId))
      .returning({ id: knowledgeEntries.id });
    if (!row) {
      return NextResponse.json({ error: "المدخل غير موجود" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  }
  if (action === "verify" || action === "unverify") {
    const [row] = await db
      .update(knowledgeEntries)
      .set({ verified: action === "verify" })
      .where(eq(knowledgeEntries.id, entryId))
      .returning({ id: knowledgeEntries.id });
    if (!row) {
      return NextResponse.json({ error: "المدخل غير موجود" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 });
}
