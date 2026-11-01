import { NextRequest, NextResponse } from "next/server";
import { ensureSeeded } from "@/lib/seed";
import { runInternalVulnerabilityScan } from "@/lib/security-ai";

export const dynamic = "force-dynamic";

/** تشغيل فحص داخلي سريع على المسارات الأساسية */
export async function POST(req: NextRequest) {
  await ensureSeeded();
  const origin = req.nextUrl.origin;
  const result = await runInternalVulnerabilityScan(origin);
  return NextResponse.json({ ok: true, ...result });
}
