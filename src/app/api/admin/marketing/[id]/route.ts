import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { marketingPosts } from "@/db/schema";
import { isAdmin } from "@/lib/auth";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const postId = Number(id);
  if (!Number.isFinite(postId)) {
    return NextResponse.json({ error: "معرّف غير صالح" }, { status: 400 });
  }
  const body = await req.json();
  const action = String(body.action ?? "");
  const status = action === "approve" ? "approved" : action === "reject" ? "rejected" : null;
  if (!status) {
    return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 });
  }
  const [row] = await db
    .update(marketingPosts)
    .set({ status })
    .where(eq(marketingPosts.id, postId))
    .returning({ id: marketingPosts.id });
  if (!row) {
    return NextResponse.json({ error: "المحتوى غير موجود" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
