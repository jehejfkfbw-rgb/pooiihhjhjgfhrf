import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { ensureSeeded, getSettings } from "@/lib/seed";
import { isDbAlive, DB_MISSING_MSG } from "@/lib/db-check";
import { logSecurityEvent, readBodyPreview, requestMeta } from "@/lib/security-ai";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

const digits = (s: string) => s.replace(/\D/g, "");

export async function POST(req: NextRequest) {
  try {
    if (!(await isDbAlive())) {
      return NextResponse.json({ ok: false, error: DB_MISSING_MSG }, { status: 503 });
    }
    await ensureSeeded();
    const body = (await req.json().catch(() => ({}))) as { code?: string; phone?: string };
    const verdict = await logSecurityEvent({ ...requestMeta(req, "track"), bodyText: readBodyPreview(body) });
    const sec = await getSettings();
    if (verdict.blocked && sec.security_auto_block !== "false") {
      return NextResponse.json({ ok: false, error: "تم إيقاف طلب التتبع لأن البيانات المرسلة بدت مشبوهة." }, { status: 403 });
    }
    const code = (body.code ?? "").trim().toUpperCase().slice(0, 12);
    const phone = digits(body.phone ?? "").slice(-9);

    if (!code || phone.length < 8) {
      return NextResponse.json({ ok: false, error: "اكتب كود الطلب ورقم موبايلك" }, { status: 400 });
    }

    const [order] = await db.select().from(orders).where(eq(orders.code, code)).limit(1);
    if (!order || digits(order.phone).slice(-9) !== phone) {
      return NextResponse.json(
        { ok: false, error: "مش لاقيين طلب بالكود والرقم ده — اتأكد منهم أو كلمنا على 01503724381" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ok: true,
      order: {
        code: order.code,
        name: order.name,
        serviceName: order.serviceName,
        price: order.price,
        status: order.status,
        progress: order.progress,
        assignee: order.assignee,
        deadline: order.deadline,
        deliveryDays: order.deliveryDays,
        events: order.events,
        createdAt: order.createdAt,
        // ملف الكود بيظهر بس بعد التسليم
        deliverable: order.status === "delivered" ? order.deliverable : "",
        deliverableName: order.status === "delivered" ? order.deliverableName : "",
      },
    });
  } catch (err) {
    console.error("track error", err);
    return NextResponse.json({ ok: false, error: "حصلت مشكلة، جرب تاني" }, { status: 500 });
  }
}
