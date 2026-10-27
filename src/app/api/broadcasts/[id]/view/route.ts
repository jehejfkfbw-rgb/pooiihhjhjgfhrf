import { sql } from "drizzle-orm";
import { db } from "@/db";
import { clientFingerprint, rateLimit } from "@/lib/auth";
import { safeRoute } from "@/lib/http";
import { isUuid } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * POST /api/broadcasts/[id]/view
 * يعدّ مشاهدة واحدة عندما يظهر البثّ لمستخدم. عام (بلا جلسة) لكنه مقيّد بمعدل
 * طلبات لكل جهاز/عنوان حتى لا يُتلاعب بالعدّاد.
 */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  return safeRoute(async () => {
    if (!isUuid(id)) {
      return Response.json({ ok: true, data: { views: null, matched: false, reason: "invalid-id" } });
    }

    const key = await clientFingerprint(`broadcast-view:${id}`);
    if (!(await rateLimit(key, 12, 60_000))) {
      return Response.json({ ok: true, data: { views: null, matched: false, reason: "rate-limited" } });
    }

    const result = await db.execute(
      sql`update broadcasts set views = views + 1 where id = ${id}::uuid returning views`,
    );
    const rows = (result as unknown as { rows?: Array<{ views: number }> }).rows ?? [];
    const views = rows[0]?.views ?? null;

    return Response.json({ ok: true, data: { views, matched: views !== null } });
  });
}
