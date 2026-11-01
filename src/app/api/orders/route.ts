import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, services } from "@/db/schema";
import { ensureSeeded } from "@/lib/nova-seed";
import { desc, eq } from "drizzle-orm";
import { logSecurityEvent, requestMeta } from "@/lib/nova-security";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureSeeded();
    const rows = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(100);
    return NextResponse.json({ ok: true, orders: rows });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureSeeded();
    const body = await req.json();
    const { name, phone, serviceId, details } = body;

    if (!name || !phone || !serviceId) return NextResponse.json({ ok: false, error: "بيانات ناقصة" }, { status: 400 });

    const [srv] = await db.select().from(services).where(eq(services.id, serviceId)).limit(1);
    if (!srv) return NextResponse.json({ ok: false, error: "الخدمة غير موجودة" }, { status: 404 });

    const code = `NV-${Math.floor(1000 + Math.random() * 9000)}`;
    
    const [row] = await db.insert(orders).values({
      code,
      name,
      phone,
      serviceId,
      serviceName: srv.name,
      details,
      price: srv.price,
      events: [{ t: new Date().toISOString(), text: "تم تسجيل الطلب بنجاح." }]
    }).returning();

    return NextResponse.json({ ok: true, code: row.code });
  } catch (err) {
    return NextResponse.json({ ok: false, error: "فشل في تسجيل الطلب" }, { status: 500 });
  }
}
