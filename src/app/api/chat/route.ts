import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { chatLogs, knowledge } from "@/db/schema";
import { ensureSeeded, getSettings } from "@/lib/seed";
import {
  cairoNow,
  withinWindow,
  matchKnowledge,
  pickFallback,
  DAY_NAMES,
} from "@/lib/nova-ai";
import { isDbAlive, DB_MISSING_MSG } from "@/lib/db-check";
import { logSecurityEvent, readBodyPreview, requestMeta } from "@/lib/security-ai";
import { eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

function parseDays(raw: string): number[] {
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((n) => typeof n === "number") : [0, 1, 2, 3, 4, 5, 6];
  } catch {
    return [0, 1, 2, 3, 4, 5, 6];
  }
}

/** حالة البوت الحالية */
export async function GET() {
  try {
    if (!(await isDbAlive())) {
      return NextResponse.json({
        ok: true, enabled: true, withinHours: true,
        start: "09:00", end: "23:30", days: [6,0,1,2,3,4],
        welcome: DB_MISSING_MSG,
      });
    }
    const s = await getSettings();
    const { day, minutes } = cairoNow();
    const days = parseDays(s.work_days);
    const within = withinWindow(day, minutes, s.hours_start, s.hours_end, days);
    return NextResponse.json({
      ok: true,
      enabled: s.bot_enabled === "true",
      withinHours: within,
      start: s.hours_start,
      end: s.hours_end,
      days,
      welcome: s.welcome_msg,
    });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await isDbAlive())) {
      return NextResponse.json({
        ok: true,
        reply: DB_MISSING_MSG,
        matched: false, withinHours: true, source: "no-db",
      });
    }

    await ensureSeeded();
    const body = (await req.json().catch(() => ({}))) as {
      message?: string;
      sessionId?: string;
      force?: boolean;
    };
    const verdict = await logSecurityEvent({ ...requestMeta(req, "chat"), bodyText: readBodyPreview(body) });
    const message = (body.message ?? "").slice(0, 600).trim();
    const sessionId = (body.sessionId ?? "anon").slice(0, 64);
    const force = body.force === true;

    if (!message) {
      return NextResponse.json({ ok: false, error: "رسالة فاضية" }, { status: 400 });
    }

    const s = await getSettings();
    if (verdict.blocked && s.security_auto_block !== "false" && !force) {
      return NextResponse.json({
        ok: true,
        reply: "تم اعتراض الرسالة تلقائيًا بواسطة AI Security Agents لأن فيها نمط مشبوه. لو ده خطأ، كلمنا مباشرة على 01503724381.",
        matched: false,
        withinHours: true,
        source: "security-block",
      });
    }
    const rows = await db.select().from(knowledge);
    const { day, minutes } = cairoNow();
    const days = parseDays(s.work_days);
    const within = withinWindow(day, minutes, s.hours_start, s.hours_end, days);
    const daysLabel = days.length === 7 ? "كل أيام الأسبوع" : days.map((d) => DAY_NAMES[d]).join("، ");

    const fill = (tpl: string) =>
      tpl
        .replaceAll("{start}", s.hours_start)
        .replaceAll("{end}", s.hours_end)
        .replaceAll("{days}", daysLabel);

    // البوت متقفل من لوحة المطور؟
    if (s.bot_enabled !== "true" && !force) {
      const reply =
        "المساعد الذكي متوقف مؤقتًا للصيانة والتطوير. كلمنا مباشرة على 01503724381 (مكالمة أو واتساب) وهنخدمك فورًا.";
      await db.insert(chatLogs).values({
        sessionId, question: message, answer: reply, matched: false, inHours: within,
      });
      return NextResponse.json({ ok: true, reply, matched: false, withinHours: within, source: "disabled" });
    }

    const { row } = matchKnowledge(rows, message);
    let reply: string;
    let matched = false;

    if (row) {
      matched = true;
      await db.update(knowledge).set({ hits: sql`${knowledge.hits} + 1` }).where(eq(knowledge.id, row.id));
      const answer = fill(row.answer);
      reply = within || force
        ? answer
        : `${fill(s.offhours_msg)}\n\nبس علشانك، ده رد سريع من ذاكرة نوفا:\n${answer}`;
    } else {
      reply = within || force ? pickFallback(sessionId) : fill(s.offhours_msg);
    }

    await db.insert(chatLogs).values({
      sessionId, question: message, answer: reply, matched, inHours: within,
    });

    return NextResponse.json({
      ok: true, reply, matched, withinHours: within, source: matched ? "knowledge" : "fallback", category: row?.category ?? null,
    });
  } catch (err) {
    console.error("chat error", err);
    return NextResponse.json(
      { ok: true, reply: "حصلت مشكلة تقنية مؤقتة.. جرب تاني بعد ثواني أو كلمنا على 01503724381", matched: false, withinHours: true, source: "error" },
      { status: 200 },
    );
  }
}
