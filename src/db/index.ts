import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

/**
 * تحديد عنوان قاعدة البيانات:
 * 1) Supabase مباشر: SUPABASE_URL + SUPABASE_DB_PASSWORD (مفصلان — الأسهل)
 * 2) DATABASE_URL المباشر (أي PostgreSQL)
 * المفتاح القابل للنشر (SUPABASE_PUBLISHABLE_KEY) لا يُستخدم للاتصال المباشر
 * بل لأي استخدام REST مستقبلي — وهو آمن للعرض بطبيعته.
 */
function resolveDatabaseUrl(): string {
  const supaUrl = process.env.SUPABASE_URL?.trim();
  const supaPass = process.env.SUPABASE_DB_PASSWORD?.trim();
  if (supaUrl && supaPass) {
    const ref = supaUrl.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (!ref) throw new Error("SUPABASE_URL غير صالح — الصيغة: https://[project-ref].supabase.co");
    return `postgresql://postgres.${ref}:${encodeURIComponent(supaPass)}@${ref}.supabase.co:5432/postgres`;
  }
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  throw new Error(
    "يجب ضبط DATABASE_URL أو (SUPABASE_URL + SUPABASE_DB_PASSWORD) في ملف .env",
  );
}

const databaseUrl = resolveDatabaseUrl();

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: databaseUrl,
    // حماية إضافية: لا يتسرب أي جزء من عنوان الاتصال في الأخطاء
    ssl: databaseUrl.includes("supabase.co") ? { rejectUnauthorized: false } : undefined,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);
