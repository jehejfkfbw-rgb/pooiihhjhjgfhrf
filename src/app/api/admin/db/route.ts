import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/db";
import { ensureSeeded } from "@/lib/seed";

export const dynamic = "force-dynamic";

/** القائمة البيضاء — تصفح آمن بدون أي SQL خام من المتصفح */
const TABLES = [
  { name: "orders", label: "الطلبات" },
  { name: "services", label: "كتالوج الخدمات" },
  { name: "ai_devs", label: "وكلاء الذكاء" },
  { name: "staff", label: "الموظفون" },
  { name: "security_agents", label: "وكلاء الأمن" },
  { name: "security_events", label: "الأحداث الأمنية" },
  { name: "security_reports", label: "التقارير الأمنية" },
  { name: "projects", label: "المشاريع" },
  { name: "knowledge", label: "قاعدة المعرفة" },
  { name: "leads", label: "رسائل العملاء" },
  { name: "chat_logs", label: "سجل المحادثات" },
  { name: "settings", label: "الإعدادات" },
] as const;

const ALLOWED: Set<string> = new Set(TABLES.map((t) => t.name as string));

function safeConn() {
  try {
    const u = new URL(process.env.DATABASE_URL ?? "");
    return { host: u.hostname, port: u.port || "5432", db: u.pathname.replace("/", "") };
  } catch {
    return { host: "127.0.0.1", port: "5432", db: "app_db" };
  }
}

export async function GET(req: NextRequest) {
  try {
    await ensureSeeded();
    const table = req.nextUrl.searchParams.get("table");
    const page = Math.max(1, Number(req.nextUrl.searchParams.get("page")) || 1);
    const size = 15;

    // نظرة عامة على كل الجداول
    if (!table) {
      const overview = [];
      for (const t of TABLES) {
        const rows = await pool.query(`SELECT count(*)::int AS c FROM "${t.name}"`);
        overview.push({ ...t, count: rows.rows[0]?.c ?? 0 });
      }
      return NextResponse.json({ ok: true, conn: safeConn(), tables: overview });
    }

    // تصفح جدول معين — الجدول لازم يكون في القائمة البيضاء
    if (!ALLOWED.has(table as string)) {
      return NextResponse.json({ ok: false, error: "جدول غير مسموح" }, { status: 400 });
    }
    const countRes = await pool.query(`SELECT count(*)::int AS c FROM "${table}"`);
    const total = countRes.rows[0]?.c ?? 0;
    const hasId = await pool.query(
      `SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = 'id'`,
      [table],
    );
    const orderClause = hasId.rowCount ? "ORDER BY id DESC" : "";
    const rowsRes = await pool.query(
      `SELECT * FROM "${table}" ${orderClause} LIMIT ${size} OFFSET ${(page - 1) * size}`,
    );
    return NextResponse.json({
      ok: true,
      table,
      total,
      page,
      pages: Math.max(1, Math.ceil(total / size)),
      columns: rowsRes.fields.map((f) => f.name),
      rows: rowsRes.rows,
    });
  } catch (err) {
    console.error("db browser error", err);
    return NextResponse.json({ ok: false, error: "مشكلة في قراءة القاعدة" }, { status: 500 });
  }
}
