import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, services } from "@/db/schema";
import { ensureSeeded, getSettings } from "@/lib/seed";
import { desc, eq } from "drizzle-orm";
import { isDbAlive, DB_MISSING_MSG } from "@/lib/db-check";
import { isEmergencyMode, logSecurityEvent, readBodyPreview, requestMeta } from "@/lib/security-ai";

export const dynamic = "force-dynamic";

// شلنا Supabase — الطلبات هتتسجل بدون user_id حاليًا
async function getSessionUserId(req: NextRequest): Promise<string> {
  return "";
}

export async function GET() {
  if (!(await isDbAlive())) return NextResponse.json({ ok: false, error: DB_MISSING_MSG, orders: [] }, { status: 503 });
  await ensureSeeded();
  const rows = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(300);
  return NextResponse.json({ ok: true, orders: rows });
}

export async function POST(req: NextRequest) {
  try {
    if (!(await isDbAlive())) {
      return NextResponse.json({ ok: false, error: "قاعدة البيانات مش متوصلة — كلمنا واتساب 01503724381" }, { status: 503 });
    }
    await ensureSeeded();
    const body = (await req.json().catch(() => ({}))) as {
      name?: string; phone?: string; serviceId?: number; details?: string;
    };
    const verdict = await logSecurityEvent({ ...requestMeta(req, "order"), bodyText: readBodyPreview(body) });
    const sec = await getSettings();
    if (await isEmergencyMode()) {
      return NextResponse.json({ ok: false, error: "درع الطوارئ مفعل مؤقتًا — إنشاء الطلبات متوقف لحماية المنصة." }, { status: 423 });
    }
    if (verdict.blocked && sec.security_auto_block !== "false") {
      return NextResponse.json({ ok: false, error: "تم رفض الطلب آليًا لأن النمط المرسل يبدو مشبوهًا." }, { status: 403 });
    }
    const name = (body.name ?? "").slice(0, 120).trim();
    const phone = (body.phone ?? "").replace(/[^\d+]/g, "").slice(0, 20);
    const details = (body.details ?? "").slice(0, 1500).trim();
    const serviceId = Number(body.serviceId) || 0;

    if (!name || phone.length < 8 || !serviceId) {
      return NextResponse.json({ ok: false, error: "اكتب اسمك ورقم موبايل صح واختار الخدمة" }, { status: 400 });
    }

    const [srv] = await db.select().from(services).where(eq(services.id, serviceId)).limit(1);
    if (!srv || !srv.active) {
      return NextResponse.json({ ok: false, error: "الخدمة دي مش متاحة حاليًا" }, { status: 400 });
    }

    const code = `NV-${1000 + Math.floor(Math.random() * 9000)}`;
    const userId = await getSessionUserId(req);
    const [row] = await db.insert(orders).values({
      code,
      name,
      phone,
      userId,
      serviceId,
      serviceName: srv.name,
      details,
      price: srv.price,
      deliveryDays: srv.deliveryDays,
      status: "new",
      progress: 0,
      events: [
        { t: new Date().toISOString(), text: "فريق الاستقبال سجّل طلبك وبيتراجع دلوقتي" },
      ],
    }).returning();

    return NextResponse.json({ ok: true, code: row.code });
  } catch (err) {
    console.error("order error", err);
    return NextResponse.json({ ok: false, error: "حصلت مشكلة، جرب تاني" }, { status: 500 });
  }
}
