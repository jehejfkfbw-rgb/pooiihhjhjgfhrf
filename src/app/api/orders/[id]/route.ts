import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { aiDevs, orders } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };
type Action = "accept" | "start" | "review" | "deliver" | "reject" | "progress" | "note";

const PROGRESS: Record<string, number> = { new: 0, accepted: 10, inprogress: 50, review: 85, delivered: 100 };

export async function PUT(req: NextRequest, ctx: Ctx) {
  try {
    // Next 16: params لازم يتاخد بـ await
    const { id } = await ctx.params;
    const body = (await req.json().catch(() => ({}))) as {
      action?: Action; progress?: number; note?: string;
      deliverable?: string; deliverableName?: string;
    };

    const [order] = await db.select().from(orders).where(eq(orders.id, Number(id))).limit(1);
    if (!order) return NextResponse.json({ ok: false, error: "الطلب مش موجود" }, { status: 404 });

    const now = new Date();
    const push = (text: string) => [...(order.events ?? []), { t: now.toISOString(), text }];
    const patch: Record<string, unknown> = {};

    switch (body.action) {
      case "accept": {
        if (order.status !== "new") break;
        // تعيين وكيل AI متاح + حساب موعد التسليم
        const devs = await db.select().from(aiDevs);
        const agent = devs.find((d) => d.status === "online") ?? devs[0] ?? null;
        const deadline = new Date(now.getTime() + (order.deliveryDays || 7) * 86400000);
        deadline.setUTCHours(15, 0, 0, 0); // 6 مساءً بتوقيت القاهرة

        patch.status = "accepted";
        patch.progress = PROGRESS.accepted;
        patch.deadline = deadline;
        patch.assignee = agent ? `${agent.code} · ${agent.name}` : "فريق نوفا";
        patch.agentId = agent?.id ?? 0;
        patch.events = push(
          `تم قبول الطلب — قدّرنا التسليم بعد ${order.deliveryDays} يوم عمل (لحد ${deadline.toISOString().slice(0, 10)})${agent ? ` وعيّننا ${agent.name}` : ""}`,
        );

        if (agent) {
          await db.update(aiDevs)
            .set({ status: "mission", mission: `بينفذ طلب ${order.code} — ${order.serviceName}` })
            .where(eq(aiDevs.id, agent.id));
        }
        break;
      }
      case "start": {
        if (order.status !== "accepted") break;
        patch.status = "inprogress";
        patch.progress = PROGRESS.inprogress;
        patch.events = push("بدأ التنفيذ فعليًا — الوكيل المسؤول بيبني المشروع");
        break;
      }
      case "review": {
        if (order.status !== "inprogress") break;
        patch.status = "review";
        patch.progress = PROGRESS.review;
        patch.events = push("دخل مراجعة الجودة النهائية");
        break;
      }
      case "progress": {
        if (!["accepted", "inprogress", "review"].includes(order.status)) break;
        patch.progress = Math.min(99, Math.max(10, Number(body.progress) || 0));
        patch.events = push(`نسبة الإنجاز وصلت ${patch.progress}%`);
        break;
      }
      case "deliver": {
        if (!["review", "inprogress"].includes(order.status)) break;
        const deliverable = (body.deliverable ?? "").trim();
        if (!deliverable) {
          return NextResponse.json({ ok: false, error: "الصق ملف الكود قبل التسليم" }, { status: 400 });
        }
        patch.status = "delivered";
        patch.progress = PROGRESS.delivered;
        patch.deliverable = deliverable;
        patch.deliverableName = (body.deliverableName ?? "").slice(0, 80) || `${order.code}-source.txt`;
        patch.events = push(`تم التسليم النهائي — الملف ${patch.deliverableName} متاح للعميل من صفحة التتبع`);

        // تحرير الوكيل + احتساب مشروع مسلّم
        if (order.agentId) {
          await db.update(aiDevs).set({
            status: "online",
            mission: "متفرغ لاستقبال مهمة جديدة",
            projectsDone: sql`${aiDevs.projectsDone} + 1`,
            xp: sql`least(100, ${aiDevs.xp} + 4)`,
          }).where(eq(aiDevs.id, order.agentId));
        }
        break;
      }
      case "reject": {
        if (order.status !== "new") break;
        patch.status = "rejected";
        patch.events = push("اعتذرنا عن الطلب — سيتواصل الفريق مع العميل");
        break;
      }
      case "note": {
        const note = (body.note ?? "").trim().slice(0, 300);
        if (!note) break;
        patch.events = push(`ملاحظة من الفريق: ${note}`);
        break;
      }
      default:
        return NextResponse.json({ ok: false, error: "إجراء غير معروف" }, { status: 400 });
    }

    if (!Object.keys(patch).length) {
      return NextResponse.json({ ok: false, error: `الحالة الحالية (${order.status}) مش بتسمح بالإجراء ده` }, { status: 400 });
    }

    const [row] = await db.update(orders).set(patch).where(eq(orders.id, order.id)).returning();
    return NextResponse.json({ ok: true, order: row });
  } catch (err) {
    console.error("order PUT error", err);
    return NextResponse.json({ ok: false, error: "خطأ في السيرفر" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  await db.delete(orders).where(eq(orders.id, Number(id)));
  return NextResponse.json({ ok: true });
}
