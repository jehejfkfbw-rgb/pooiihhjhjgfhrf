import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const FALLBACK = "postgresql://postgres:postgres@127.0.0.1:5432/app_db";

function resolveDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (url) return url;
  console.warn("[NOVA][DB] DATABASE_URL مش متسجل — هنستخدم القاعدة المحلية.");
  return FALLBACK;
}

const databaseUrl = resolveDatabaseUrl();

// تفعيل SSL تلقائيًا لأي قاعدة سحابية (مش محلية)
const needsSsl =
  !databaseUrl.includes("127.0.0.1") &&
  !databaseUrl.includes("localhost");

const globalForDb = globalThis as typeof globalThis & {
  __novaPool?: Pool;
};

export const pool =
  globalForDb.__novaPool ??
  new Pool({
    connectionString: databaseUrl,
    ...(needsSsl ? { ssl: { rejectUnauthorized: false } } : {}),
    max: 8,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__novaPool = pool;
}

export const db = drizzle(pool);
