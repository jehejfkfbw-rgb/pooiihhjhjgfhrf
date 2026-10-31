import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { leads } from "@/db/schema";
import { ensureSeeded, getSettings } from "@/lib/seed";
import { isDbAlive, DB_MISSING_MSG } from "@/lib/db-check";
import { isEmergencyMode, logSecurityEvent, readBodyPreview, requestMeta } from "@/lib/security-ai";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isDbAlive())) return NextResponse.json({ ok: false, error: DB_MISSING_MSG }, { status: 503 });
  await ensureSeeded();
  const rows = await db.select().from(leads).orderBy(desc(leads.createdAt)).limit(200);
  return NextResponse.json({ ok: true, leads: rows });
}

export async function POST(req: NextRequest) {
  try {
    if (!(await isDbAlive())) {
      return NextResponse.json({ ok: false, error: "قاعدة البيانات مش متوصلة — كلمنا واتساب 01503724381 وهنسجل طلبك يدوي" }, { status: 503 });
    }
    const body = (await req.json().catch(() => ({}))) as {
      name?: string; phone?: string; service?: string; message?: string;
    };
    await ensureSeeded();
    const verdict = await logSecurityEvent({ ...requestMeta(req, "lead"), bodyText: readBodyPreview(body) });
    const sec = await getSettings();
    if (await isEmergencyMode()) {
      return NextResponse.json({ ok: false, error: "درع الطوارئ مفعل مؤقتًا — الاستقبال متوقف لحماية المنصة. كلمنا 01503724381." }, { status: 423 });
    }
    if (verdict.blocked && sec.security_auto_block !== "false") {
      return NextResponse.json({ ok: false, error: "تم رفض الطلب تلقائيًا لأن فيه نمط مشبوه. لو ده خطأ، ابعتلنا واتساب." }, { status: 403 });
    }
    const name = (body.name ?? "").slice(0, 120).trim();
    const phone = (body.phone ?? "").slice(0, 30).trim();
    const service = (body.service ?? "").slice(0, 120).trim();
    const message = (body.message ?? "").slice(0, 1200).trim();

    if (!name || (!phone && !message)) {
      return NextResponse.json({ ok: false, error: "اكتب اسمك ورقمك أو رسالتك على الأقل" }, { status: 400 });
    }
    const [row] = await db.insert(leads).values({ name, phone, service, message }).returning();
    return NextResponse.json({ ok: true, lead: row });
  } catch (err) {
    console.error("lead error", err);
    return NextResponse.json({ ok: false, error: "حصلت مشكلة، كلمنا واتساب 01503724381" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!(await isDbAlive())) return NextResponse.json({ ok: false }, { status: 503 });
  const body = (await req.json().catch(() => ({}))) as { id?: number; status?: string };
  if (!body.id || !body.status) return NextResponse.json({ ok: false }, { status: 400 });
  const [row] = await db.update(leads).set({ status: body.status }).where(eq(leads.id, body.id)).returning();
  return NextResponse.json({ ok: true, lead: row });
}
