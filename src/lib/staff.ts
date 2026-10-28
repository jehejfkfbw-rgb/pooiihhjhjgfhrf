import crypto from "crypto";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { staff } from "@/db/schema";

// ============================================================
// إدارة حسابات الموظفين — تشفير scrypt وحسابات افتراضية آمنة
// ============================================================

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const calc = crypto.scryptSync(password, salt, 32);
  const expected = Buffer.from(hash, "hex");
  if (calc.length !== expected.length) return false;
  return crypto.timingSafeEqual(calc, expected);
}

export const DEFAULT_STAFF_PASS = process.env.STAFF_PASS ?? "Team@2025";

const DEFAULT_STAFF = [
  {
    name: "ليلى",
    username: "laila",
    role: "cs",
    title: "خدمة عملاء — السوق المصري",
  },
  {
    name: "فهد",
    username: "fahd",
    role: "cs",
    title: "خدمة عملاء — السوق السعودي",
  },
  {
    name: "مروان",
    username: "marwan",
    role: "marketing",
    title: "صانع محتوى — سوشيال ميديا",
  },
  {
    name: "دانا",
    username: "dana",
    role: "marketing",
    title: "كاتبة سكريبتات — فيديو وإعلانات",
  },
];

/** تُنشئ الحسابات الافتراضية مرة واحدة فقط عند أول تشغيل */
export async function ensureDefaultStaff(): Promise<void> {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(staff);
  if (Number(count) > 0) return;
  await db.insert(staff).values(
    DEFAULT_STAFF.map((s) => ({
      name: s.name,
      username: s.username,
      passwordHash: hashPassword(DEFAULT_STAFF_PASS),
      role: s.role,
      title: s.title,
    })),
  );
}

export function roleLabel(role: string): string {
  if (role === "cs") return "فريق خدمة العملاء";
  if (role === "marketing") return "فريق التسويق";
  if (role === "dev") return "فريق التطوير";
  return "موظف";
}

export async function findStaffByUsername(username: string) {
  const [row] = await db
    .select()
    .from(staff)
    .where(eq(staff.username, username.trim().toLowerCase()))
    .limit(1);
  return row ?? null;
}
