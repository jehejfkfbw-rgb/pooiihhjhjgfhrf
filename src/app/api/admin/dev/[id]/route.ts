import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { devTasks, orders } from "@/db/schema";
import { isAdmin } from "@/lib/auth";

// اعتماد / رفض مقترح فريق التطوير — الاعتماد يعتمد الطلب المرتبط تلقائياً
export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const taskId = Number(id);
  if (!Number.isFinite(taskId)) {
    return NextResponse.json({ error: "معرّف غير صالح" }, { status: 400 });
  }
  const body = await req.json();
  const action = String(body.action ?? "");
  const status = action === "approve" ? "approved" : action === "reject" ? "rejected" : null;
  if (!status) {
    return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 });
  }

  const [task] = await db
    .update(devTasks)
    .set({ status })
    .where(eq(devTasks.id, taskId))
    .returning();

  if (!task) {
    return NextResponse.json({ error: "المهمة غير موجودة" }, { status: 404 });
  }

  // عند اعتماد المقترح، يُعتمد طلب العميل المرتبط — وعند الرفض يبقى الطلب جديداً لإعادة التجهيز
  if (status === "approved" && task.orderId) {
    await db
      .update(orders)
      .set({ status: "approved" })
      .where(eq(orders.id, task.orderId));
  }

  return NextResponse.json({ ok: true });
}
