import { NextResponse } from "next/server";
import { db } from "@/db";
import { chatLogs, knowledge, leads, projects } from "@/db/schema";
import { ensureSeeded, getSettings } from "@/lib/seed";
import { desc, eq, sql } from "drizzle-orm";
import { cairoNow, withinWindow, DAY_NAMES } from "@/lib/nova-ai";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureSeeded();
  const s = await getSettings();

  const [p] = await db.select({
    total: sql<number>`count(*)::int`,
    done: sql<number>`count(*) filter (where status = 'done')::int`,
    ongoing: sql<number>`count(*) filter (where status = 'ongoing')::int`,
    queued: sql<number>`count(*) filter (where status = 'queued')::int`,
    budgetDone: sql<number>`coalesce(sum(budget) filter (where status = 'done'), 0)::int`,
    budgetActive: sql<number>`coalesce(sum(budget) filter (where status != 'done'), 0)::int`,
  }).from(projects);

  const [l] = await db.select({
    total: sql<number>`count(*)::int`,
    fresh: sql<number>`count(*) filter (where status = 'new')::int`,
  }).from(leads);

  const [c] = await db.select({
    total: sql<number>`count(*)::int`,
    matched: sql<number>`count(*) filter (where matched)::int`,
    unmatched: sql<number>`count(*) filter (where not matched)::int`,
  }).from(chatLogs);

  const [k] = await db.select({
    total: sql<number>`count(*)::int`,
    active: sql<number>`count(*) filter (where active)::int`,
    hits: sql<number>`coalesce(sum(hits), 0)::int`,
  }).from(knowledge);

  const recentChats = await db.select().from(chatLogs).orderBy(desc(chatLogs.createdAt)).limit(10);
  const recentLeads = await db.select().from(leads).orderBy(desc(leads.createdAt)).limit(6);

  const days = (() => { try { return JSON.parse(s.work_days) as number[]; } catch { return []; } })();
  const { day, minutes, clock } = cairoNow();
  const within = withinWindow(day, minutes, s.hours_start, s.hours_end, days);

  return NextResponse.json({
    ok: true,
    stats: {
      projects: p,
      leads: l,
      chats: { ...c, matchRate: c.total ? Math.round((c.matched / c.total) * 100) : 100 },
      knowledge: k,
    },
    bot: {
      enabled: s.bot_enabled === "true",
      within,
      clock,
      start: s.hours_start,
      end: s.hours_end,
      daysLabel: days.map((d: number) => DAY_NAMES[d]).join(" · "),
    },
    recentChats,
    recentLeads,
    topQuestions: await db
      .select({ question: chatLogs.question, n: sql<number>`count(*)::int` })
      .from(chatLogs)
      .where(eq(chatLogs.matched, false))
      .groupBy(chatLogs.question)
      .orderBy(sql`count(*) desc`)
      .limit(8),
  });
}
