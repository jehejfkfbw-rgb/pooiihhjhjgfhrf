import { NextRequest, NextResponse } from "next/server";
import { ensureSeeded } from "@/lib/seed";
import { setEmergencyMode } from "@/lib/security-ai";

export const dynamic = "force-dynamic";

/** زر الطوارئ — يشغّل/يقفل وضع العزل السريع */
export async function PUT(req: NextRequest) {
  await ensureSeeded();
  const body = (await req.json().catch(() => ({}))) as { on?: boolean };
  await setEmergencyMode(Boolean(body.on));
  return NextResponse.json({ ok: true, lockdown: Boolean(body.on) });
}
