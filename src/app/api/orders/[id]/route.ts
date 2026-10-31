import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { aiDevs, orders, services } from "@/db/schema";
import { smartWrite } from "@/lib/forge";
import { eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };
type Action = "accept" | "start" | "review" | "deliver" | "reject" | "progress" | "note";

const STATUS_PROGRESS: Record<string, number> = {
  new: 0, accepted: 10, inprogress: 50, review: 85, delivered: 100,
};

export async function PUT(req: NextRequest, ctx: Ctx) {
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
      // الذكاء الاصطناعي المحلي بيحدد المهندس المتاح وتاريخ التسليم بالظبط
      const devs = await db.select().from(aiDevs);
      const agent = devs.find((d) => d.status === "online") ?? devs[0] ?? null;
      const deadline = new Date(now.getTime() + order.deliveryDays * 86400000);
      deadline.setUTCHours(15, 0, 0, 0); // التسليم 6 مساءً بتوقيت القاهرة

      patch.status = "accepted";
      patch.progress = STATUS_PROGRESS.accepted;
      patch.deadline = deadline;
      patch.assignee = agent ? `${agent.code} · ${agent.name}` : "فريق نوفا";
      patch.agentId = agent?.id ?? 0;

      // 🔥 الكاتب المحلي بيشتغل لوحده: يحلل الطلب ويولّد الكود تلقائيًا
      let draftNote = "";
      try {
        const [srv] = await db.select().from(services).where(eq(services.id, order.serviceId)).limit(1);
        const build = smartWrite({
          code: order.code,
          client: order.name,
          serviceName: order.serviceName,
          category: srv?.category ?? "web",
          features: srv?.features ?? [],
          details: order.details,
        });
        const lineCount = build.files.reduce((s, f) => s + f.lines.length, 0);
        patch.draftCode = build.files
          .map((f) => "// ========== " + f.path + " ==========\n" + f.lines.join("\n"))
          .join("\n\n\n");
        patch.draftName = `${order.code}-nova-local-build.txt`;
        patch.draftAt = now;
        draftNote = ` — الكاتب المحلي ولّد ${build.files.length} ملفات (${lineCount} سطر) تلقائيًا`;
      } catch (e) {
        console.error("auto-write failed", e);
      }

      patch.events = push(
        `تم قبول الطلب. نظام نوفا قدّر مدة التنفيذ بـ ${order.deliveryDays} أيام عمل وعيّن المهندس المسؤول — التسليم المتوقع ${deadline.toISOString()}${draftNote}`,
      );

      if (agent) {
        await db.update(aiDevs)
          .set({ status: "mission", mission: `بينفذ طلب ${order.code} — ${order.serviceName}` })
          .where(eq(aiDevs.id, agent.id));
      }
      break;
    }
    case "start": {
      if (!["accepted"].includes(order.status)) break;
      patch.status = "inprogress";
      patch.progress = STATUS_PROGRESS.inprogress;
      patch.events = push("بدأ التنفيذ فعليًا — الوكيل المسؤول بيبني المشروع دلوقتي");
      break;
    }
    case "progress": {
      if (!["inprogress", "accepted", "review"].includes(order.status)) break;
      patch.progress = Math.min(99, Math.max(10, Number(body.progress) || 0));
      patch.events = push(`نسبة الإنجاز وصلت ${patch.progress}%`);
      break;
    }
    case "review": {
      if (order.status !== "inprogress") break;
      patch.status = "review";
      patch.progress = STATUS_PROGRESS.review;
      patch.events = push("المشروع دخل مراجعة الجودة النهائية");
      break;
    }
    case "deliver": {
      if (!["review", "inprogress"].includes(order.status)) break;
      // لو مفيش كود مرفق يدوي — سلّم الكود اللي الكاتب المحلي ولّده لوحده
      const deliverable = ((body.deliverable ?? "").trim() || order.draftCode || order.deliverable).trim();
      if (!deliverable) {
        return NextResponse.json({ ok: false, error: "مفيش كود جاهز — شغّل الكاتب المحلي من الاستوديو الأول" }, { status: 400 });
      }
      patch.status = "delivered";
      patch.progress = 100;
      patch.deliverable = deliverable;
      patch.deliverableName =
        (body.deliverableName ?? "").slice(0, 80) ||
        (deliverable === order.draftCode ? order.draftName : "") ||
        `${order.code}-source.txt`;
      patch.events = push("تم التسليم النهائي — العميل يقدر يحمّل ملف الكود كامل من صفحة التتبع");

      // الوكيل يرجع متاح + يتحسب له مشروع جديد
      if (order.agentId) {
        await db.update(aiDevs)
          .set({
            status: "online",
            mission: "متفرغ لاستقبال مهمة جديدة",
            projectsDone: sql`${aiDevs.projectsDone} + 1`,
            xp: sql`least(100, ${aiDevs.xp} + 4)`,
          })
          .where(eq(aiDevs.id, order.agentId));
      }
      break;
    }
    case "reject": {
      if (!["new"].includes(order.status)) break;
      patch.status = "rejected";
      patch.events = push("اعتذرنا عن الطلب — هيتم التواصل مع العميل لتوضيح السبب");
      if (order.agentId) {
        await db.update(aiDevs)
          .set({ status: "online", mission: "متفرغ لاستقبال مهمة جديدة" })
          .where(eq(aiDevs.id, order.agentId));
      }
      break;
    }
    case "note": {
      const note = (body.note ?? "").slice(0, 300).trim();
      if (!note) break;
      patch.events = push(`ملاحظة من الفريق: ${note}`);
      break;
    }
    default:
      return NextResponse.json({ ok: false, error: "إجراء غير معروف" }, { status: 400 });
  }

  if (!Object.keys(patch).length) {
    return NextResponse.json({ ok: false, error: "مفيش حاجة اتغيرت — الحالة الحالية مش بتسمح بالإجراء ده" }, { status: 400 });
  }

  const [row] = await db.update(orders).set(patch).where(eq(orders.id, order.id)).returning();
  return NextResponse.json({ ok: true, order: row });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  await db.delete(orders).where(eq(orders.id, Number(id)));
  return NextResponse.json({ ok: true });
}
