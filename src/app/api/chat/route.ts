import { NextResponse } from "next/server";
import { db } from "@/db";
import { chatMessages } from "@/db/schema";
import { detectMarket, runCustomerServiceAgent } from "@/lib/agents";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const sessionId = String(body.sessionId ?? "").slice(0, 80) || "anon";
    const message = String(body.message ?? "").trim().slice(0, 2000);
    const history = Array.isArray(body.history) ? body.history : [];

    if (!message) {
      return NextResponse.json({ error: "الرسالة فارغة" }, { status: 400 });
    }

    const market = detectMarket(message);
    const { reply, agent } = await runCustomerServiceAgent(
      market,
      history
        .filter((h: { role?: string }) => h?.role === "user" || h?.role === "assistant")
        .map((h: { role: string; content?: string }) => ({
          role: h.role as "user" | "assistant",
          content: String(h.content ?? "").slice(0, 1000),
        })),
      message,
    );

    // تخزين المحادثة للمتابعة من لوحة التحكم
    await db.insert(chatMessages).values([
      { sessionId, role: "user", content: message },
      { sessionId, role: "assistant", agentName: agent.name, content: reply },
    ]);

    return NextResponse.json({ ok: true, reply, agent: agent.name });
  } catch (e) {
    console.error("chat POST error", e);
    return NextResponse.json(
      { error: "خدمة المحادثة غير متاحة حالياً" },
      { status: 500 },
    );
  }
}
