import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { chatLogs } from "@/db/schema";
import { ensureSeeded } from "@/lib/seed";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/** سجل المحادثات — مقاوم للأخطاء: القاعدة ناقصة عمود؟ يرجّع بدل ما يكسر */
export async function GET(req: NextRequest) {
  try {
    await ensureSeeded();
    const unmatched = req.nextUrl.searchParams.get("unmatched") === "1";
    const base = db.select().from(chatLogs);
    const rows = unmatched
      ? await base.where(eq(chatLogs.matched, false)).orderBy(desc(chatLogs.createdAt)).limit(150)
      : await base.orderBy(desc(chatLogs.createdAt)).limit(150);
    return NextResponse.json({ ok: true, chats: rows });
  } catch (err) {
    console.error("chats GET error", err);
    return NextResponse.json({ ok: true, chats: [], degraded: true });
  }
}

export async function DELETE() {
  try {
    await db.delete(chatLogs);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
