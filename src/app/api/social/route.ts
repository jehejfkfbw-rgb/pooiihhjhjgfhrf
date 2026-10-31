import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { socialIdeas } from "@/db/schema";
import { ensureSeeded } from "@/lib/seed";
import { geminiSocialIdea, localSocialIdea } from "@/lib/gemini";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

function cairoDay(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Cairo",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const g = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${g("year")}-${g("month")}-${g("day")}`;
}

/** فكرة اليوم — بتتولد مرة واحدة لكل يوم وتتخزن */
export async function GET(req: NextRequest) {
  try {
    await ensureSeeded();
    const all = req.nextUrl.searchParams.get("all") === "1";
    if (all) {
      const rows = await db.select().from(socialIdeas).orderBy(desc(socialIdeas.createdAt)).limit(40);
      return NextResponse.json({ ok: true, ideas: rows });
    }

    const day = cairoDay();
    const [existing] = await db.select().from(socialIdeas).where(eq(socialIdeas.day, day)).limit(1);
    if (existing) return NextResponse.json({ ok: true, idea: existing, fresh: false });

    const dayIndex = Math.floor(Date.now() / 86400000);
    const fromGemini = await geminiSocialIdea(dayIndex);
    const ideaData = fromGemini ?? localSocialIdea(dayIndex);

    const [row] = await db.insert(socialIdeas).values({
      day,
      title: ideaData.title,
      body: ideaData.body,
      hashtags: ideaData.hashtags ?? [],
      bestTime: ideaData.bestTime ?? "",
      platform: ideaData.platform ?? "",
      source: ideaData.source,
    }).returning();

    return NextResponse.json({ ok: true, idea: row, fresh: true });
  } catch (err) {
    console.error("social error", err);
    return NextResponse.json({ ok: false, error: "مشكلة مؤقتة" }, { status: 500 });
  }
}

/** تعليم فكرة إنها اتنشرت */
export async function PUT(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { id?: number; published?: boolean };
  if (!body.id) return NextResponse.json({ ok: false }, { status: 400 });
  const [row] = await db
    .update(socialIdeas)
    .set({ published: Boolean(body.published) })
    .where(eq(socialIdeas.id, body.id))
    .returning();
  return NextResponse.json({ ok: true, idea: row });
}
