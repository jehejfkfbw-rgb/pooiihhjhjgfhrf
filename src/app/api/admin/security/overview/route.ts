import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { securityAgents, settings } from "@/db/schema";
import { ensureSeeded } from "@/lib/seed";
import { recentSecuritySnapshot } from "@/lib/security-ai";
import { asc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/** لوحة مركز العمليات الأمنية — snapshot حي */
export async function GET(req: NextRequest) {
  await ensureSeeded();
  const agents = await db.select().from(securityAgents).orderBy(asc(securityAgents.id));
  const lock = await db.select().from(settings).where(eq(settings.key, "security_lockdown")).limit(1);
  const auto = await db.select().from(settings).where(eq(settings.key, "security_auto_block")).limit(1);
  const keepalive = await db.select().from(settings).where(eq(settings.key, "security_keepalive")).limit(1);
  const snapshot = await recentSecuritySnapshot();
  const forwardedProto = req.headers.get("x-forwarded-proto") ?? "https";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? req.nextUrl.host;
  const proto = /localhost|127\.0\.0\.1|0\.0\.0\.0/.test(host) ? forwardedProto : "https";
  const origin = `${proto}://${host}`;

  return NextResponse.json({
    ok: true,
    links: {
      site: origin,
      dashboard: `${origin}/nx-core-9f2a`,
    },
    security: {
      lockdown: lock[0]?.value === "true",
      autoBlock: auto[0]?.value !== "false",
      keepalive: keepalive[0]?.value !== "false",
    },
    agents,
    ...snapshot,
  });
}
