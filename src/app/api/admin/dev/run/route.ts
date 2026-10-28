import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, devTasks } from "@/db/schema";
import { isAdmin } from "@/lib/auth";
import { runDevTeam } from "@/lib/agents";

// تشغيل فريق التطوير (كريم، سارة، عمر) على طلب عميل
export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  const body = await req.json();
  const taskId = Number(body.taskId);
  if (!Number.isFinite(taskId)) {
    return NextResponse.json({ error: "معرّف مهمة غير صالح" }, { status: 400 });
  }

  const [task] = await db
    .select()
    .from(devTasks)
    .where(eq(devTasks.id, taskId))
    .limit(1);
  if (!task) {
    return NextResponse.json({ error: "المهمة غير موجودة" }, { status: 404 });
  }

  let orderText = "لا توجد تفاصيل إضافية.";
  let service = "مشروع مخصص";
  if (task.orderId) {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, task.orderId))
      .limit(1);
    if (order) {
      service = order.service;
      orderText = `العميل: ${order.clientName}\nالخدمة: ${order.service}\nالميزانية: ${order.budget ?? "غير محددة"}\nالتفاصيل: ${order.details}`;
    }
  }

  const result = await runDevTeam(orderText, service);

  await db
    .update(devTasks)
    .set({ content: result.content, status: "pending" })
    .where(eq(devTasks.id, taskId));

  return NextResponse.json({ ok: true, via: result.via, content: result.content });
}
