import { NextRequest, NextResponse } from "next/server";
import { geminiReady, askGemini } from "@/lib/gemini";

export const dynamic = "force-dynamic";

/** حالة محرك Gemini + اختبار حي */
export async function GET(req: NextRequest) {
  const ready = geminiReady();
  const withTest = req.nextUrl.searchParams.get("test") === "1";
  const payload: Record<string, unknown> = { ok: true, ready };

  if (withTest && ready) {
    const r = await askGemini("رد بكلمة واحدة: شغال", 32);
    payload.test = { ok: r.ok, text: r.text.slice(0, 200), error: r.error ?? null, ms: r.ms };
  } else if (withTest) {
    payload.test = { ok: false, text: "", error: "GEMINI_API_KEY مش متسجل", ms: 0 };
  }

  return NextResponse.json(payload);
}
