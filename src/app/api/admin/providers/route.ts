import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { modelUsage } from "@/db/schema";
import { isAdmin } from "@/lib/auth";
import { probeProviders } from "@/lib/model";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  const providers = await probeProviders();
  const [agg] = await db
    .select({
      calls: sql<number>`count(*)`,
      okCalls: sql<number>`count(*) filter (where "ok")`,
      promptChars: sql<number>`coalesce(sum("prompt_chars"),0)`,
      completionChars: sql<number>`coalesce(sum("completion_chars"),0)`,
      avgMs: sql<number>`coalesce(avg("duration_ms"),0)`,
      costMicro: sql<number | null>`sum(cost_usd)`,
    })
    .from(modelUsage);

  return NextResponse.json({
    providers,
    usage: {
      calls: agg.calls,
      okCalls: agg.okCalls,
      promptChars: agg.promptChars,
      completionChars: agg.completionChars,
      avgMs: Math.round(agg.avgMs),
      // null = غير متاح (لا أسعار معرفة للمزود/النموذج الحالي)
      costUsd: agg.costMicro != null ? agg.costMicro / 1_000_000 : null,
    },
  });
}
