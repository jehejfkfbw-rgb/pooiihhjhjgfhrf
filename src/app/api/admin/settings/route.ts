import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { getSettings } from "@/lib/seed";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

const ALLOWED = new Set([
  "bot_enabled", "hours_start", "hours_end", "work_days", "welcome_msg", "offhours_msg", "core_motto",
]);

export async function GET() {
  const s = await getSettings();
  return NextResponse.json({ ok: true, settings: s });
}

export async function PUT(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  let changed = 0;
  for (const [key, raw] of Object.entries(body)) {
    if (!ALLOWED.has(key)) continue;
    const value = typeof raw === "string" ? raw.slice(0, 2000) : JSON.stringify(raw);
    await db
      .insert(settings)
      .values({ key, value })
      .onConflictDoUpdate({ target: settings.key, set: { value: sql`excluded.value` } });
    changed++;
  }
  const s = await getSettings();
  return NextResponse.json({ ok: true, changed, settings: s });
}
