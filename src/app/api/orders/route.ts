import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, devTasks } from "@/db/schema";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const clientName = String(body.clientName ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const service = String(body.service ?? "").trim();
    const budget = String(body.budget ?? "").trim();
    const details = String(body.details ?? "").trim();

    if (!clientName || clientName.length < 2) {
      return NextResponse.json({ error: "الاسم مطلوب" }, { status: 400 });
    }
    if (!phone || phone.replace(/\D/g, "").length < 8) {
      return NextResponse.json(
        { error: "رقم جوال صحيح مطلوب للتواصل" },
        { status: 400 },
      );
    }
    if (!service) {
      return NextResponse.json({ error: "اختر الخدمة المطلوبة" }, { status: 400 });
    }
    if (!details || details.length < 10) {
      return NextResponse.json(
        { error: "اشرح فكرة مشروعك بما لا يقل عن 10 أحرف" },
        { status: 400 },
      );
    }

    const [order] = await db
      .insert(orders)
      .values({ clientName, phone, service, budget: budget || null, details })
      .returning({ id: orders.id });

    // إنشاء مهمة لفريق التطوير — تُجهَّز بالذكاء الاصطناعي وتُعتمد من الإدارة
    await db.insert(devTasks).values({
      orderId: order.id,
      title: `مقترح تنفيذ: ${service} — للعميل ${clientName}`,
      content: null,
      status: "pending",
    });

    return NextResponse.json({ ok: true, orderId: order.id });
  } catch (e) {
    console.error("orders POST error", e);
    return NextResponse.json({ error: "تعذر إرسال الطلب حالياً" }, { status: 500 });
  }
}
