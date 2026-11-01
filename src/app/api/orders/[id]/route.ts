import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, { params }: { params: any }) {
  const { id } = params;
  const body = await req.json();
  const { status, progress, deliverable, eventText } = body;

  const [order] = await db.select().from(orders).where(eq(orders.id, Number(id))).limit(1);
  if (!order) return NextResponse.json({ ok: false }, { status: 404 });

  const events = [...(order.events || [])];
  if (eventText) events.push({ t: new Date().toISOString(), text: eventText });

  const [updated] = await db.update(orders).set({
    status: status ?? order.status,
    progress: progress ?? order.progress,
    deliverable: deliverable ?? order.deliverable,
    events
  }).where(eq(orders.id, Number(id))).returning();

  return NextResponse.json({ ok: true, order: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: any }) {
  await db.delete(orders).where(eq(orders.id, Number(params.id)));
  return NextResponse.json({ ok: true });
}
