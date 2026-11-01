import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { chatLogs, knowledge, settings } from "@/db/schema";
import { ensureSeeded } from "@/lib/seed";
import { normalizeArabic, matchKnowledge, pickFallback } from "@/lib/nova-engine";
import { logSecurityEvent, requestMeta } from "@/lib/nova-security";
import { isEmergencyMode } from "@/lib/security-ai";
import { orders, services as servicesTable } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureSeeded();
    const rows = await db.select().from(settings);
    const map: Record<string, string> = {};
    for (const r of rows) map[r.key] = r.value;
    return NextResponse.json({
      ok: true,
      enabled: map.bot_status !== "offline",
      withinHours: true,
      lockdown: map.lockdown_mode === "true",
      welcome: "أهلًا بيك في نوفا ديجيتال! أنا نورا — اسألني عن الخدمات، الأسعار، أو تابع طلبك بكود التتبع.",
    });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureSeeded();
    const body = await req.json();
    const message = (body.message ?? "").trim();
    
    // فحص أمني آلي
    const meta = requestMeta(req);
    const verdict = await logSecurityEvent({ ...meta, source: "chat", bodyText: message });
    
    if (verdict.blocked) {
      return NextResponse.json({
        ok: true,
        reply: "تم حظر الرسالة آلياً بواسطة Nova Security Core لوجود نشاط مشبوه.",
        source: "security"
      });
    }

    // درع الطوارئ مفعّل؟
    try {
      if (await isEmergencyMode()) {
        return NextResponse.json({
          ok: true,
          reply: "⚠️ المنصة في وضع الحماية القصوى حاليًا (تم رصد محاولة اختراق) والخدمة متوقفة مؤقتًا — خط الطوارئ: 01503724381",
          source: "lockdown",
        });
      }
    } catch { /* تجاهل */ }

    if (!message) return NextResponse.json({ ok: false }, { status: 400 });

    // 🎯 أمر تتبّع ذكي: العميل يكتب كود الطلب في الشات وتطلع حالته فورًا
    const codeMatch = message.match(/\bNV[-\s]?(\d{3,6})\b/i);
    if (codeMatch) {
      const code = `NV-${codeMatch[1]}`;
      const [order] = await db.select().from(orders).where(eq(orders.code, code)).limit(1);
      const STATUS_AR: Record<string, string> = {
        new: "جديد — قيد المراجعة من فريق الاستقبال",
        accepted: "مقبول ✓ — اتعيّن له مهندس وموعد تسليم محدد",
        inprogress: "قيد التنفيذ 🔨 — الوكيل شغال على مشروعك دلوقتي",
        review: "في مراجعة الجودة 🔍 — خلص تقريبًا",
        delivered: "تم التسليم ✅ — ملف الكود جاهز من صفحة (تتبع طلبك)",
        rejected: "اعتذرنا عنه — كلمنا على 01503724381 للتوضيح",
      };
      const reply = order
        ? `🔍 لقيت طلبك يا باشا:\n📦 ${order.serviceName} (${code})\n📊 الحالة: ${STATUS_AR[order.status] ?? order.status}\n📈 نسبة الإنجاز: ${order.progress}%${order.deadline ? `\n📅 موعد التسليم: ${new Date(order.deadline).toLocaleDateString("ar-EG")}` : ""}\n\nلتفاصيل أكتر وتحميل ملف الكود: افتح (تتبع طلبك) في الموقع بالكود ورقم موبايلك.`
        : `مش لاقيين طلب بالكود ${code} — اتأكد من الكود أو كلمنا على 01503724381.`;
      await db.insert(chatLogs).values({ question: message, answer: reply, matched: true, ip: meta.ip });
      return NextResponse.json({ ok: true, reply, matched: true, source: "tracking" });
    }

    // 🧮 الميزة الجديدة: حاسبة التقدير الذكي — يقدّر السعر والمدة من الكتالوج
    const wantsEstimate = /قدّر|قدرلي|حاسب|حاسبه|كم هتكلف|كم بتكلف|تكلف|كم سعر|شقدر|估/.test(message);
    if (wantsEstimate) {
      const svcs = await db.select().from(servicesTable).where(eq(servicesTable.active, true));
      const KIND_MAP: Array<[RegExp, string[]]> = [
        [/موقع|صفحة|ويب|لندنج/, ["web", "website"]],
        [/متجر|بييع|اونلاين|ايكومرس/, ["store"]],
        [/تطبيق|موبايل|ابليكيشن|ايفون|اندرويد/, ["app"]],
        [/بوت|شات|روبوت|ذكاء/, ["ai"]],
        [/نظام|تحكيم|اداره|erp|crm/, ["system"]],
        [/لوجو|شعار|هوية|تصميم/, ["design"]],
        [/اعلان|سوشيال|تسويق/, ["marketing"]],
      ];
      let cats: string[] = [];
      for (const [re, c] of KIND_MAP) if (re.test(message)) { cats = c; break; }
      let pool = cats.length ? svcs.filter((s) => cats.includes(s.category)) : [];
      if (!pool.length) pool = svcs; // fallback: أي خدمات متاحة
      const top = pool.slice(0, 2);
      if (top.length) {
        const lines = top.map((s) =>
          `• ${s.name}: يبدأ من ${s.price.toLocaleString("ar-EG")} ج.م — تسليم ~${s.deliveryDays} يوم`,
        ).join("\n");
        const reply =
          `🧮 حاسبة نوفا — تقدير فوري لفكرتك:\n\n${lines}\n\n` +
          `📌 ده تقدير مبدئي من الكتالوج (السعر النهائي بيتحدد بعد جلسة تحليل مجانية).\n` +
          `لو عايز عرض سعر مفصّل: كلمنا 01503724381 أو اطلب من قسم (اطلب خدمتك) وهيجيلك كود تتبع.`;
        await db.insert(chatLogs).values({ question: message, answer: reply, matched: true, ip: meta.ip });
        return NextResponse.json({ ok: true, reply, matched: true, source: "estimator" });
      }
    }

    const rows = await db.select().from(knowledge);
    const { row } = matchKnowledge(rows, message);
    
    let reply = row ? row.answer : pickFallback();
    
    await db.insert(chatLogs).values({
      question: message,
      answer: reply,
      matched: !!row,
      ip: meta.ip
    });

    return NextResponse.json({ ok: true, reply, source: row ? "knowledge" : "fallback" });
  } catch (err) {
    return NextResponse.json({ ok: false, reply: "حصلت مشكلة تقنية، جرب تاني كمان شوية." }, { status: 200 });
  }
}
