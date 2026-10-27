import { and, desc, eq, gt } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { broadcasts } from "@/db/schema";
import { audit, clientFingerprint, rateLimit, requireAdmin } from "@/lib/auth";
import { readJson, safeRoute } from "@/lib/http";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  message: z.string().trim().min(2, "اكتب نص الرسالة").max(280, "الرسالة طويلة جدًا (٢٨٠ حرفًا كحد أقصى)"),
  tone: z.enum(["info", "gold", "success", "urgent"]).optional().default("gold"),
  durationSeconds: z.coerce.number().int().min(3, "٣ ثوانٍ على الأقل").max(60, "٦٠ ثانية كحد أقصى").optional().default(10),
  activeForMinutes: z.coerce.number().int().min(1).max(1440).optional().default(15),
});

/**
 * GET /api/broadcasts — البثّ الحيّ الحالي (عام لكل الزوار).
 * يُنادى من مُستمع البثّ في كل الصفحات كل بضع ثوانٍ.
 */
export async function GET() {
  return safeRoute(async () => {
    const now = new Date();
    const [row] = await db
      .select({
        id: broadcasts.id,
        message: broadcasts.message,
        tone: broadcasts.tone,
        durationSeconds: broadcasts.durationSeconds,
        createdAt: broadcasts.createdAt,
        createdByName: broadcasts.createdByName,
      })
      .from(broadcasts)
      .where(and(eq(broadcasts.isActive, true), gt(broadcasts.activeUntil, now)))
      .orderBy(desc(broadcasts.createdAt))
      .limit(1);

    return Response.json({
      ok: true,
      data: { broadcast: row ?? null, serverTime: now.toISOString() },
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  });
}

/** POST /api/broadcasts — بثّ رسالة فورية لكل المستخدمين (للمدير فقط) */
export async function POST(req: Request) {
  return safeRoute(async () => {
    const admin = await requireAdmin();
    const key = await clientFingerprint("broadcast");
    if (!(await rateLimit(key, 20, 60_000))) {
      return Response.json({ ok: false, message: "بثّات كثيرة خلال دقيقة — انتظر قليلًا" }, { status: 429 });
    }

    const body = createSchema.parse(await readJson(req));
    const activeUntil = new Date(Date.now() + body.activeForMinutes * 60_000);

    // بثّ واحد حيّ في اللحظة نفسها: أوقف ما قبله حتى لا تتزاحم الرسائل
    await db.update(broadcasts).set({ isActive: false }).where(eq(broadcasts.isActive, true));

    const [created] = await db
      .insert(broadcasts)
      .values({
        message: body.message,
        tone: body.tone,
        durationSeconds: body.durationSeconds,
        isActive: true,
        activeUntil,
        views: 0,
        createdById: admin.id,
        createdByName: admin.fullName,
      })
      .returning();

    await audit("broadcast.sent", {
      userId: admin.id,
      entity: "broadcast",
      entityId: created.id,
      meta: { durationSeconds: created.durationSeconds, tone: created.tone, activeUntil: created.activeUntil.toISOString() },
    });

    return Response.json(
      {
        ok: true,
        message: `تم بثّ الرسالة لكل المستخدمين — تظهر ${created.durationSeconds} ثوانٍ حتى ${activeUntil.toLocaleTimeString("ar")}`,
        data: { broadcast: created },
      },
      { status: 201 },
    );
  });
}
