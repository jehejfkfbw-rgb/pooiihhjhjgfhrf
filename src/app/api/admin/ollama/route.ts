import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { ollamaHealth } from "@/lib/ollama";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  const health = await ollamaHealth();
  return NextResponse.json(health);
}
