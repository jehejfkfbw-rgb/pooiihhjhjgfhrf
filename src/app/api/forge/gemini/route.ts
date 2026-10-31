import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, services } from "@/db/schema";
import { ensureSeeded } from "@/lib/seed";
import { geminiReady, askGemini } from "@/lib/gemini";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/** Gemini بيكتب كود حقيقي لطلب معين — شغل موظف حقيقي */
export async function POST(req: NextRequest) {
  try {
    await ensureSeeded();
    if (!geminiReady()) {
      return NextResponse.json({ ok: false, error: "محرك Gemini مش متفعل — حط GEMINI_API_KEY في البيئة" }, { status: 503 });
    }
    const body = (await req.json().catch(() => ({}))) as { orderId?: number };
    const orderId = Number(body.orderId) || 0;
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!order) return NextResponse.json({ ok: false, error: "الطلب مش موجود" }, { status: 404 });

    const [srv] = await db.select().from(services).where(eq(services.id, order.serviceId)).limit(1);
    const prompt =
      `اكتب كود كامل وشغال لمشروع: ${order.serviceName} لصالح العميل: ${order.name}.\n` +
      `التفاصيل: ${order.details || "لا توجد تفاصيل إضافية"}\n` +
      `المتطلبات: ${srv?.features?.join("، ") || ""}\n` +
      "اكتب ملف HTML واحد كامل (مع CSS و JS داخله) باللغة العربية RTL، تصميم حديث داكن، " +
      "ويشتغل مباشرة عند فتحه. أرجع الكود فقط بدون شرح.";
    const r = await askGemini(prompt, 4096);
    if (!r.ok) {
      return NextResponse.json({ ok: false, error: r.error ?? "فشل توليد الكود" }, { status: 502 });
    }
    return NextResponse.json({ ok: true, code: r.text, ms: r.ms });
  } catch (err) {
    console.error("forge gemini error", err);
    return NextResponse.json({ ok: false, error: "مشكلة مؤقتة" }, { status: 500 });
  }
}
