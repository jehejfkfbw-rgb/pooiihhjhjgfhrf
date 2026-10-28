import { NextResponse } from "next/server";
import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { knowledgeEntries, knowledgeTopics } from "@/db/schema";
import { isAdmin } from "@/lib/auth";
import { kbSearch, kbStats } from "@/lib/nebras/kb";

const vec = sql`to_tsvector('simple',
  coalesce(${knowledgeEntries.title}, ' ') || ' ' ||
  coalesce(${knowledgeEntries.summary}, ' ') || ' ' ||
  coalesce(${knowledgeEntries.content}, ' ') || ' ' ||
  coalesce(${knowledgeEntries.tags}, ' '))`;

export async function GET(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const category = url.searchParams.get("category") ?? "";
  const topicKey = url.searchParams.get("topic") ?? "";
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") ?? 20)));

  const stats = await kbStats();

  let entries;
  if (q) {
    const hits = await kbSearch(q, { category: category || undefined, limit });
    entries = hits
      .filter((h) => (topicKey ? h.topicKey === topicKey : true))
      .map((h) => ({ ...h, updatedAt: null }));
  } else {
    const where = and(
      category ? eq(knowledgeEntries.category, category) : undefined,
      topicKey ? eq(knowledgeEntries.topicKey, topicKey) : undefined,
    );
    entries = await db
      .select()
      .from(knowledgeEntries)
      .where(where)
      .orderBy(desc(knowledgeEntries.usageCount))
      .limit(limit);
  }

  return NextResponse.json({
    stats,
    entries: entries.map((e) => ({
      id: e.id,
      title: e.title,
      category: e.category,
      topicKey: e.topicKey,
      language: e.language,
      tech: e.tech,
      version: e.version,
      summary: e.summary,
      content: e.content,
      code: e.code,
      source: e.source,
      license: e.license,
      sourceUrl: e.sourceUrl,
      verified: e.verified,
      usageCount: e.usageCount,
      tags: e.tags,
    })),
  });
}

export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  const body = await req.json();
  const title = String(body.title ?? "").trim().slice(0, 200);
  const content = String(body.content ?? "").trim();
  const summary = String(body.summary ?? "").trim().slice(0, 600) || content.slice(0, 300);
  const topicKey = String(body.topicKey ?? "basics").slice(0, 40);
  const category = ["concept", "guide", "example", "fix", "template", "doc"].includes(body.category)
    ? String(body.category)
    : "guide";
  const source = [
    "official-docs",
    "company-generated",
    "open-source",
    "platform-tests",
  ].includes(body.source)
    ? String(body.source)
    : "company-generated";
  const code = body.code ? String(body.code).slice(0, 50_000) : null;
  if (title.length < 5 || content.length < 20) {
    return NextResponse.json(
      { error: "العنوان والمحتوى مطلوبان (المحتوى ≥ 20 حرف)" },
      { status: 400 },
    );
  }
  const slug =
    title
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06ff]+/gi, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 180) +
    "-" +
    Date.now().toString(36);
  const [row] = await db
    .insert(knowledgeEntries)
    .values({
      topicKey,
      title,
      slug,
      category,
      language: String(body.language ?? "").slice(0, 30) || null,
      tech: String(body.tech ?? "").slice(0, 80) || null,
      version: String(body.version ?? "").slice(0, 20) || null,
      summary,
      content: content.slice(0, 60_000),
      code,
      source,
      license: String(body.license ?? "").slice(0, 60) || null,
      sourceUrl: String(body.sourceUrl ?? "").slice(0, 300) || null,
      tags: String(body.tags ?? "").slice(0, 300) || null,
    })
    .returning({ id: knowledgeEntries.id });
  return NextResponse.json({ ok: true, id: row.id });
}
