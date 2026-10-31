import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { ensureSeeded } from "@/lib/seed";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureSeeded();
  const rows = await db.select().from(projects).orderBy(desc(projects.id));
  return NextResponse.json({ ok: true, projects: rows });
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const title = String(body.title ?? "").trim().slice(0, 160);
  if (!title) return NextResponse.json({ ok: false, error: "اسم المشروع مطلوب" }, { status: 400 });
  const status = ["ongoing", "done", "queued"].includes(String(body.status)) ? String(body.status) : "queued";
  const progress = Math.min(100, Math.max(0, Number(body.progress) || 0));
  const [row] = await db.insert(projects).values({
    title,
    client: String(body.client ?? "").slice(0, 160),
    type: String(body.type ?? "website").slice(0, 30),
    description: String(body.description ?? "").slice(0, 600),
    tech: String(body.tech ?? "").slice(0, 200),
    status,
    progress: status === "done" ? 100 : progress,
    budget: Math.max(0, Number(body.budget) || 0),
    year: String(body.year ?? new Date().getFullYear()).slice(0, 8),
  }).returning();
  return NextResponse.json({ ok: true, project: row });
}
