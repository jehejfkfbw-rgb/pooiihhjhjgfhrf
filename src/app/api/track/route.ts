import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, phone } = body;

    if (!code || !phone) return NextResponse.json({ ok: false, error: "الكود والتليفون مطلوبين" }, { status: 400 });

    const [order] = await db.select().from(orders).where(eq(orders.code, code.toUpperCase())).limit(1);

    if (!order || order.phone !== phone) {
      return NextResponse.json({ ok: false, error: "بيانات التتبع غير صحيحة" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, order });
  } catch (err) {
    return NextResponse.json({ ok: false, error: "خطأ في السيرفر" }, { status: 500 });
  }
}
