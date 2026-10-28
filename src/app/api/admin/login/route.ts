import { NextResponse } from "next/server";
import { ADMIN_COOKIE, createToken, credentialsOk } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!credentialsOk(body.username, body.password)) {
      await new Promise((r) => setTimeout(r, 900)); // إبطاء محاولات التخمين
      return NextResponse.json(
        { error: "بيانات الدخول غير صحيحة" },
        { status: 401 },
      );
    }
    const res = NextResponse.json({ ok: true });
    res.cookies.set(ADMIN_COOKIE, createToken(), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 12,
      path: "/",
    });
    return res;
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
}
