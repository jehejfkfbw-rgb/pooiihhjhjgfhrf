import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { chatLogs } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const unmatched = req.nextUrl.searchParams.get("unmatched") === "1";
  const base = db.select().from(chatLogs);
  const rows = unmatched
    ? await base.where(eq(chatLogs.matched, false)).orderBy(desc(chatLogs.createdAt)).limit(150)
    : await base.orderBy(desc(chatLogs.createdAt)).limit(150);
  return NextResponse.json({ ok: true, chats: rows });
}

export async function DELETE() {
  await db.delete(chatLogs);
  return NextResponse.json({ ok: true });
}
