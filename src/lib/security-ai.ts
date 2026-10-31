import { db } from "@/db";
import { securityEvents, securityReports, settings } from "@/db/schema";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import type { NextRequest } from "next/server";

type SecuritySeverity = "low" | "medium" | "high" | "critical";
type SecurityType = "traffic" | "probe" | "xss" | "sqli" | "bruteforce" | "vuln-scan" | "lockdown" | "automation";

export type TrafficInput = {
  source: string;
  path: string;
  method: string;
  ip: string;
  userAgent: string;
  bodyText?: string;
};

export type TrafficVerdict = {
  type: SecurityType;
  severity: SecuritySeverity;
  score: number;
  blocked: boolean;
  summary: string;
  payload: Record<string, unknown>;
};

const SQLI_PATTERNS = [
  /union\s+select/i,
  /drop\s+table/i,
  /or\s+1=1/i,
  /information_schema/i,
  /insert\s+into/i,
  /benchmark\s*\(/i,
];

const XSS_PATTERNS = [
  /<script/i,
  /onerror\s*=/i,
  /onload\s*=/i,
  /javascript:/i,
  /<iframe/i,
];

const PROBE_PATTERNS = [
  /\.env/i,
  /wp-admin/i,
  /adminer/i,
  /phpmyadmin/i,
  /etc\/passwd/i,
  /\.git/i,
  /select%20/i,
  /sqlmap/i,
];

const BOT_PATTERNS = [/curl\//i, /python-requests/i, /sqlmap/i, /nikto/i, /wget\//i];

function truncate(v: string, n = 240) {
  return v.length > n ? v.slice(0, n) + "…" : v;
}

/** حلّل الطلب وطلع مستوى الخطورة */
export function analyzeTraffic(input: TrafficInput): TrafficVerdict {
  const body = input.bodyText ?? "";
  const joined = `${input.path}\n${input.userAgent}\n${body}`;
  let score = 0;
  let type: SecurityType = "traffic";
  let severity: SecuritySeverity = "low";
  let blocked = false;
  let why = "حركة طبيعية";

  if (SQLI_PATTERNS.some((r) => r.test(joined))) {
    type = "sqli";
    severity = "critical";
    score += 96;
    blocked = true;
    why = "تم رصد نمط شبيه بحقن SQL";
  }

  if (XSS_PATTERNS.some((r) => r.test(joined))) {
    type = "xss";
    severity = severity === "critical" ? "critical" : "high";
    score += 78;
    blocked = true;
    why = why === "حركة طبيعية" ? "تم رصد نمط شبيه بـ XSS" : `${why} + XSS`;
  }

  if (PROBE_PATTERNS.some((r) => r.test(joined))) {
    type = type === "traffic" ? "probe" : type;
    severity = severity === "low" ? "high" : severity;
    score += 66;
    blocked = blocked || /\.env|etc\/passwd|\.git/i.test(joined);
    why = why === "حركة طبيعية" ? "محاولة استكشاف ثغرات/ملفات حساسة" : `${why} + probe`;
  }

  if (BOT_PATTERNS.some((r) => r.test(input.userAgent))) {
    type = type === "traffic" ? "automation" : type;
    severity = severity === "low" ? "medium" : severity;
    score += 28;
    why = why === "حركة طبيعية" ? "أداة آلية/بوت ظاهر من User-Agent" : `${why} + bot`;
  }

  if (["POST", "PATCH", "PUT", "DELETE"].includes(input.method.toUpperCase())) {
    score += 6;
  }

  if (input.path.startsWith("/api/admin")) {
    score += 12;
    severity = severity === "low" ? "medium" : severity;
  }

  if (body.length > 1200) {
    score += 12;
    severity = severity === "low" ? "medium" : severity;
    why = why === "حركة طبيعية" ? "حمولة كبيرة تحتاج تدقيق" : `${why} + payload-large`;
  }

  if (score >= 90) severity = "critical";
  else if (score >= 65 && severity !== "critical") severity = "high";
  else if (score >= 30 && severity === "low") severity = "medium";

  return {
    type,
    severity,
    score,
    blocked,
    summary: truncate(`${why} — ${input.method} ${input.path}`),
    payload: {
      bodyPreview: truncate(body, 320),
      source: input.source,
    },
  };
}

export function readBodyPreview(raw: unknown): string {
  if (!raw) return "";
  if (typeof raw === "string") return raw;
  try {
    return JSON.stringify(raw);
  } catch {
    return String(raw);
  }
}

export function requestMeta(req: NextRequest, source = "web"): Omit<TrafficInput, "bodyText"> {
  const forwarded = req.headers.get("x-forwarded-for") ?? "";
  const ip = forwarded.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  return {
    source,
    path: req.nextUrl.pathname,
    method: req.method,
    ip,
    userAgent: req.headers.get("user-agent") ?? "unknown",
  };
}

/** سجل الحدث الأمني في القاعدة */
export async function logSecurityEvent(input: TrafficInput) {
  const verdict = analyzeTraffic(input);
  await db.insert(securityEvents).values({
    type: verdict.type,
    severity: verdict.severity,
    source: input.source,
    path: input.path,
    method: input.method,
    ip: input.ip,
    userAgent: input.userAgent.slice(0, 280),
    score: verdict.score,
    blocked: verdict.blocked,
    summary: verdict.summary,
    payload: verdict.payload,
  });
  return verdict;
}

/** هل وضع الطوارئ شغّال؟ */
export async function isEmergencyMode() {
  const rows = await db.select().from(settings).where(eq(settings.key, "security_lockdown")).limit(1);
  return rows[0]?.value === "true";
}

/** فعّل/اقفل وضع الطوارئ */
export async function setEmergencyMode(on: boolean) {
  await db
    .insert(settings)
    .values({ key: "security_lockdown", value: on ? "true" : "false" })
    .onConflictDoUpdate({ target: settings.key, set: { value: on ? "true" : "false" } });

  await db.insert(securityEvents).values({
    type: "lockdown",
    severity: on ? "critical" : "medium",
    source: "soc",
    path: "/panic",
    method: on ? "LOCK" : "UNLOCK",
    ip: "internal",
    userAgent: "NOVA-SOC",
    score: on ? 100 : 40,
    blocked: on,
    summary: on ? "تم تفعيل زر الطوارئ وإغلاق المسارات الحساسة" : "تم إلغاء وضع الطوارئ والعودة للوضع الطبيعي",
    payload: {},
  });
}

/** ابنِ تقرير مراقبة مختصر من آخر 24 ساعة */
export async function buildSecurityReport(title = "تقرير نوبة الحراسة") {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [stats] = await db.select({
    total: sql<number>`count(*)::int`,
    blocked: sql<number>`count(*) filter (where blocked)::int`,
    critical: sql<number>`count(*) filter (where severity = 'critical')::int`,
    high: sql<number>`count(*) filter (where severity = 'high')::int`,
    probes: sql<number>`count(*) filter (where type = 'probe')::int`,
    sqli: sql<number>`count(*) filter (where type = 'sqli')::int`,
    xss: sql<number>`count(*) filter (where type = 'xss')::int`,
  }).from(securityEvents).where(gte(securityEvents.createdAt, since));

  const recommendations: string[] = [];
  if ((stats.critical ?? 0) > 0) recommendations.push("راجِع الأحداث الحرجة فورًا وفَعّل وضع الطوارئ لو في تكرار.");
  if ((stats.probes ?? 0) > 5) recommendations.push("زود WAF rules لمسارات الحساسية العالية والملفات المخفية.");
  if ((stats.total ?? 0) < 5) recommendations.push("الحركة هادئة — حافظ على heartbeat والمراقبة اللحظية.");
  if (recommendations.length === 0) recommendations.push("الوضع مستقر — استمر في الفحص الدوري وتحديث القواعد.");

  const summary = `رصدت النوبة ${stats.total ?? 0} حدث، منها ${stats.critical ?? 0} حرج و${stats.blocked ?? 0} تم اعتراضه آليًا.`;
  const [row] = await db.insert(securityReports).values({
    title,
    mode: "shift",
    summary,
    stats,
    recommendations,
  }).returning();
  return row;
}

/** فحص داخلي مبسط للمسارات المهمة */
export async function runInternalVulnerabilityScan(origin: string) {
  const targets = ["/api/health", "/api/chat", "/account", "/nx-core-9f2a"];
  const results: Array<{ path: string; status: number; ok: boolean; ms: number }> = [];

  for (const path of targets) {
    const started = Date.now();
    try {
      const res = await fetch(`${origin}${path}`, { signal: AbortSignal.timeout(4000) });
      results.push({ path, status: res.status, ok: res.status < 500, ms: Date.now() - started });
    } catch {
      results.push({ path, status: 0, ok: false, ms: Date.now() - started });
    }
  }

  const failed = results.filter((r) => !r.ok).length;
  await db.insert(securityEvents).values({
    type: "vuln-scan",
    severity: failed ? "high" : "low",
    source: "scanner",
    path: "/internal-scan",
    method: "SCAN",
    ip: "internal",
    userAgent: "NOVA-SCAN",
    score: failed ? 72 : 18,
    blocked: false,
    summary: failed ? `فحص داخلي رصد ${failed} مسار غير سليم` : "الفحص الداخلي مرّ بدون أعطال",
    payload: { results },
  });

  const recommendations = failed
    ? ["راجع المسارات اللي رجعت 5xx أو لم تستجب.", "اختبر الاتصال بقاعدة البيانات والـ envs الإنتاجية."]
    : ["الفحص مرّ بنجاح — استمر على نفس الوضع مع تحديثات دورية."];

  const [report] = await db.insert(securityReports).values({
    title: "فحص ثغرات داخلي تلقائي",
    mode: "scan",
    summary: failed ? `تم اكتشاف ${failed} نقطة تحتاج مراجعة.` : "كل المسارات الأساسية سليمة.",
    stats: { failed, total: results.length, avgMs: Math.round(results.reduce((s, r) => s + r.ms, 0) / results.length) },
    recommendations,
  }).returning();

  return { results, report };
}

export async function recentSecuritySnapshot() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [totals] = await db.select({
    total: sql<number>`count(*)::int`,
    blocked: sql<number>`count(*) filter (where blocked)::int`,
    high: sql<number>`count(*) filter (where severity in ('high','critical'))::int`,
    critical: sql<number>`count(*) filter (where severity = 'critical')::int`,
  }).from(securityEvents).where(gte(securityEvents.createdAt, since));

  const recent = await db.select().from(securityEvents).orderBy(desc(securityEvents.createdAt)).limit(12);
  const reports = await db.select().from(securityReports).orderBy(desc(securityReports.createdAt)).limit(6);
  return { totals, recent, reports };
}
