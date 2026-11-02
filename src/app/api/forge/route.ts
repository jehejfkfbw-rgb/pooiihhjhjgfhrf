import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, services } from "@/db/schema";
import { ensureSeeded } from "@/lib/seed";
import { buildProject } from "@/lib/forge";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await ensureSeeded();
    const orderId = Number(req.nextUrl.searchParams.get("orderId"));
    if (!orderId) return NextResponse.json({ ok: false, error: "orderId مطلوب" }, { status: 400 });

    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!order) return NextResponse.json({ ok: false, error: "الطلب مش موجود" }, { status: 404 });

    const [srv] = await db.select().from(services).where(eq(services.id, order.serviceId)).limit(1);

    const build = buildProject({
      code: order.code,
      client: order.name,
      serviceName: order.serviceName,
      category: srv?.category ?? "web",
      features: srv?.features ?? [],
    });

    return NextResponse.json({ ok: true, build, status: order.status });
  } catch (err) {
    console.error("forge error", err);
    return NextResponse.json({ ok: false, error: "مشكلة في المولّد" }, { status: 500 });
  }
}
