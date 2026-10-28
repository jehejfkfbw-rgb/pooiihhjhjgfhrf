import crypto from "crypto";
import { cookies } from "next/headers";

// ============================================================
// حماية لوحة التحكم المخفية — توقيع HMAC بدون مكتبات خارجية
// ============================================================

export const ADMIN_USER = process.env.ADMIN_USER ?? "nova_admin";
export const ADMIN_PASS = process.env.ADMIN_PASS ?? "Nova@2025";
const SECRET = process.env.ADMIN_SECRET ?? "nova-code-local-hidden-panel-2025";

export const ADMIN_COOKIE = "nc_admin_session";
const MAX_AGE_SEC = 60 * 60 * 12; // 12 ساعة

function sign(payload: string): string {
  return crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
}

export function createToken(): string {
  const exp = String(Date.now() + MAX_AGE_SEC * 1000);
  return `${exp}.${sign(exp)}`;
}

export function verifyToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return false;
  const exp = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = sign(exp);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  if (!crypto.timingSafeEqual(a, b)) return false;
  return Number(exp) > Date.now();
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return verifyToken(store.get(ADMIN_COOKIE)?.value);
}

export function credentialsOk(user: unknown, pass: unknown): boolean {
  return (
    typeof user === "string" &&
    typeof pass === "string" &&
    crypto.timingSafeEqual(
      Buffer.from(user.padEnd(64).slice(0, 64)),
      Buffer.from(ADMIN_USER.padEnd(64).slice(0, 64)),
    ) &&
    crypto.timingSafeEqual(
      Buffer.from(pass.padEnd(64).slice(0, 64)),
      Buffer.from(ADMIN_PASS.padEnd(64).slice(0, 64)),
    )
  );
}
