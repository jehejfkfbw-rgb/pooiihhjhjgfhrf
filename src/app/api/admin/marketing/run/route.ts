import { NextResponse } from "next/server";
import { db } from "@/db";
import { marketingPosts } from "@/db/schema";
import { isAdmin } from "@/lib/auth";
import { runMarketingTeam } from "@/lib/agents";

// تشغيل فريق التسويق (مروان ودانا) لإنتاج محتوى جديد
export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  const body = await req.json();
  const topic = String(body.topic ?? "").trim().slice(0, 200);
  const platform = String(body.platform ?? "تيك توك").trim().slice(0, 60);
  if (!topic) {
    return NextResponse.json({ error: "اكتب موضوع المحتوى أولاً" }, { status: 400 });
  }

  const result = await runMarketingTeam(topic, platform);

  const [row] = await db
    .insert(marketingPosts)
    .values({
      agentName: "مروان + دانا",
      platform,
      topic,
      content: result.content,
      status: "pending",
    })
    .returning({ id: marketingPosts.id });

  return NextResponse.json({ ok: true, id: row.id, via: result.via });
}
