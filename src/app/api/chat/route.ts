import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { chatLogs, knowledge, settings } from "@/db/schema";
import { ensureSeeded } from "@/lib/seed";
import { normalizeArabic, matchKnowledge, pickFallback } from "@/lib/nova-engine";
import { logSecurityEvent, requestMeta } from "@/lib/nova-security";
import { isEmergencyMode } from "@/lib/security-ai";

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
