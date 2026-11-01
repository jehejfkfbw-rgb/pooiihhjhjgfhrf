import { pool } from "@/db";

let dbReady: boolean | null = null;

/**
 * فحص سريع هل القاعدة متاحة فعلاً؟
 * النتيجة بتتكاش 30 ثانية علشان مش نختبر كل request.
 */
export async function isDbAlive(): Promise<boolean> {
  if (dbReady !== null) return dbReady;
  try {
    await pool.query("SELECT 1");
    dbReady = true;
    setTimeout(() => { dbReady = null; }, 30_000);
    return true;
  } catch {
    dbReady = false;
    setTimeout(() => { dbReady = null; }, 10_000);
    return false;
  }
}

export const DB_MISSING_MSG =
  "⚠️ قاعدة البيانات مش متوصلة.\n" +
  "لازم تضيف DATABASE_URL في إعدادات الاستضافة (Vercel → Settings → Environment Variables).\n" +
  "أو كلمنا على 01503724381 ونساعدك.";
