import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, projects, projectEvents, clientMessages } from "@/db/schema";
import { addClientMessage } from "@/lib/nebras/engine";

const TYPE_MAP: Record<string, string> = {
  "مواقع ومتاجر إلكترونية": "web",
  "تطبيقات الموبايل": "app",
  "أنظمة إدارة مخصصة ERP/CRM": "software",
  "حلول الذكاء الاصطناعي": "web",
  "تصميم UI/UX وهوية بصرية": "design",
  "استضافة وصيانة وأمان": "other",
};

function randCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `NB-${s}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const clientName = String(body.clientName ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const service = String(body.service ?? "").trim();
    const budget = String(body.budget ?? "").trim();
    const details = String(body.details ?? "").trim();
    const title = String(body.title ?? "").trim() || service || "مشروع جديد";
    const serviceType =
      String(body.serviceType ?? "").trim() || TYPE_MAP[service] || "other";
    const priority = ["low", "normal", "high", "urgent"].includes(String(body.priority))
      ? String(body.priority)
      : "normal";
    const deadlineWish = String(body.deadlineWish ?? "").trim().slice(0, 120) || null;
    const refId = String(body.refId ?? "").trim().slice(0, 64) || null;

    if (clientName.length < 2) {
      return NextResponse.json({ error: "الاسم مطلوب" }, { status: 400 });
    }
    if (phone.replace(/\D/g, "").length < 8) {
      return NextResponse.json({ error: "رقم جوال صحيح مطلوب" }, { status: 400 });
    }
    if (details.length < 10) {
      return NextResponse.json({ error: "اشرح مشروعك بما لا يقل عن 10 أحرف" }, { status: 400 });
    }

    // Idempotency: نفس الطلب المكرر لا ينشئ مشروعاً جديداً
    if (refId) {
      const existing = await db.select().from(projects).where(eq(projects.refId, refId)).limit(1);
      if (existing[0]) {
        return NextResponse.json({
          ok: true,
          duplicate: true,
          projectId: existing[0].id,
          code: existing[0].code,
          status: existing[0].status,
        });
      }
    }

    // حفظ في جدول الطلبات التقليدي أيضاً (الخصائص القديمة تبقى)
    const [order] = await db
      .insert(orders)
      .values({ clientName, phone, service, budget: budget || null, details })
      .returning({ id: orders.id });

    const code = randCode();
    const [project] = await db
      .insert(projects)
      .values({
        code,
        refId,
        orderId: order.id,
        clientName,
        clientPhone: phone,
        title: title.slice(0, 200),
        description: details.slice(0, 8000),
        serviceType,
        priority: priority as (typeof projects.priority.enumValues)[number],
        deadlineWish,
      })
      .returning({ id: projects.id, code: projects.code });

    await db.insert(projectEvents).values({
      projectId: project.id,
      kind: "intake",
      actor: "نظام الاستقبال",
      message: `استُلم الطلب من ${clientName} (${phone}) — نوع: ${serviceType}. سيبدأ العقل المركزي التحليل.`,
    });
    await addClientMessage(
      project.id,
      "system",
      `أهلاً ${clientName}، استلمنا مشروعك برمز المتابعة ${code}. العقل المركزي يبدأ التحليل الآن وسنوافيك بالخطة والتقدير. احتفظ بالرمز لمتابعة مشروعك في أي وقت.`,
    );

    // التحليل يتم في الخلفية — لا نحبس طلب العميل
    setImmediate(() => {
      import("@/lib/nebras/engine").then((m) => m.analyzeProject(project.id)).catch(() => {});
    });

    return NextResponse.json(
      { ok: true, projectId: project.id, code: project.code, status: "intake" },
      { status: 201 },
    );
  } catch (e) {
    console.error("projects POST error", e);
    return NextResponse.json({ error: "تعذر إرسال المشروع" }, { status: 500 });
  }
}
