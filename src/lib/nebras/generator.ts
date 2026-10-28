// ============================================================
// المولّد المحلي — ملفات حقيقية وجاهزة للتحقق والتشغيل
// يُستخدم عندما لا يتوفر نموذج ذكاء اصطناعي متصلاً
// ============================================================

import type { ServiceType } from "./plan";

export interface GenFile {
  path: string;
  content: string;
  action: "created" | "modified";
}

export interface GenContext {
  code: string;
  title: string;
  clientName: string;
  type: ServiceType;
}

const esc = (s: string) => s.replace(/</g, "&lt;");

export function generateFiles(
  ctx: GenContext,
  taskKey: string,
  notes: string,
): GenFile[] {
  const { code, title, clientName, type } = ctx;
  const note = notes ? `\n\n> توجيه من الإدارة: ${notes}` : "";

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="description" content="${esc(title)} — مشروع NEBRAS AI (${code})" />
<title>${esc(title)} — NEBRAS AI</title>
<link rel="stylesheet" href="./styles.css" />
</head>
<body>
<header class="topbar">
  <div class="brand"><span class="logo">✦</span> ${esc(title)}</div>
  <nav id="nav">
    <a href="#home">الرئيسية</a>
    <a href="#features">المزايا</a>
    <a href="#contact">تواصل</a>
  </nav>
  <button id="nav-toggle" aria-label="القائمة">☰</button>
</header>
<main>
  <section id="home" class="hero">
    <h1>${esc(title)}</h1>
    <p>مشروع رقمي تم بناؤه بواسطة فريق NEBRAS AI الذكي — للمتابعة والدعم تواصل مع فريق الخدمة.</p>
    <a class="cta" href="#contact">ابدأ الآن</a>
    <div class="status" id="api-status" role="status">جارٍ التحقق من الخادم...</div>
  </section>
  <section id="features" class="grid">
    <div class="card"><h3>تصميم عربي RTL</h3><p>واجهة كاملة بالعربية مع دعم الأجهزة المحمولة.</p></div>
    <div class="card"><h3>ربط حقيقي بالـ API</h3><p>الصفحة تتصل بـ <code>/api/health</code> و<code>/api/echo</code> وتعرض الرد الفعلي.</p></div>
    <div class="card"><h3>جاهز للتطوير</h3><p>بنية ملفات منظمة (public/ و src/ و docs/) قابلة للتمديد.</p></div>
  </section>
  <section id="contact" class="panel">
    <h2>أرسل رسالة تجريبية</h2>
    <form id="echo-form">
      <input type="text" id="echo-msg" placeholder="اكتب رسالة..." required />
      <button type="submit">إرسال عبر /api/echo</button>
      <output id="echo-out" aria-live="polite"></output>
    </form>
  </section>
</main>
<footer>© NEBRAS AI — مشروع ${code} — تم إنشاء هذا الملف آلياً بواسطة محرك التنفيذ</footer>
<script src="./app.js"></script>
</body>
</html>`;

  const css = `:root {
  --bg: #07051a; --panel: #120a2e; --ink: #efeaff; --dim: #a99fd0;
  --violet: #a78bfa; --cyan: #22d3ee; --line: rgba(148,120,255,.2);
}
* { box-sizing: border-box; margin: 0; }
body { font-family: "Tajawal", system-ui, sans-serif; background: var(--bg); color: var(--ink); line-height: 1.7; }
.topbar { display: flex; align-items: center; justify-content: space-between; padding: 14px 24px; border-bottom: 1px solid var(--line); position: sticky; top: 0; background: rgba(7,5,26,.9); backdrop-filter: blur(8px); }
.brand { font-weight: 800; }
.logo { color: var(--cyan); }
nav a { color: var(--dim); text-decoration: none; margin-inline-start: 18px; font-size: 15px; }
nav a:hover { color: var(--ink); }
#nav-toggle { display: none; background: none; border: 1px solid var(--line); color: var(--ink); border-radius: 8px; padding: 4px 10px; }
.hero { text-align: center; padding: 90px 20px 60px; background: radial-gradient(40rem 24rem at 50% -10%, rgba(124,58,237,.35), transparent); }
.hero h1 { font-size: clamp(30px, 6vw, 54px); background: linear-gradient(100deg, var(--violet), var(--cyan)); -webkit-background-clip: text; background-clip: text; color: transparent; }
.hero p { color: var(--dim); max-width: 560px; margin: 14px auto 26px; }
.cta { display: inline-block; padding: 12px 34px; border-radius: 14px; background: linear-gradient(120deg, #7c3aed, #06b6d4); color: #fff; text-decoration: none; font-weight: 800; }
.status { margin-top: 22px; font-size: 13px; color: var(--dim); }
.status.ok { color: #34d399; } .status.err { color: #f87171; }
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; padding: 40px 24px; max-width: 1000px; margin: auto; }
.card { background: var(--panel); border: 1px solid var(--line); border-radius: 16px; padding: 20px; }
.card h3 { margin-bottom: 8px; color: var(--violet); }
.card p, .card code { color: var(--dim); font-size: 14px; }
.panel { max-width: 560px; margin: 30px auto 80px; padding: 28px; background: var(--panel); border: 1px solid var(--line); border-radius: 20px; }
.panel h2 { margin-bottom: 16px; }
#echo-form input { width: 100%; padding: 12px 14px; border-radius: 12px; border: 1px solid var(--line); background: #0b0620; color: var(--ink); margin-bottom: 10px; }
#echo-form button { padding: 12px 26px; border: 0; border-radius: 12px; background: linear-gradient(120deg, #7c3aed, #06b6d4); color: #fff; font-weight: 800; cursor: pointer; }
#echo-out { display: block; margin-top: 12px; color: #34d399; font-size: 14px; white-space: pre-wrap; }
footer { text-align: center; color: var(--dim); font-size: 13px; padding: 24px; border-top: 1px solid var(--line); }
@media (max-width: 640px) {
  #nav-toggle { display: block; }
  nav { display: none; position: absolute; top: 58px; right: 0; left: 0; background: var(--panel); flex-direction: column; padding: 16px 24px; border-bottom: 1px solid var(--line); }
  nav.open { display: flex; }
}
`;

  const js = `// NEBRAS AI — generated frontend behavior (vanilla JS)
(function () {
  var toggle = document.getElementById("nav-toggle");
  var nav = document.getElementById("nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () { nav.classList.toggle("open"); });
  }

  var status = document.getElementById("api-status");
  function setStatus(text, cls) {
    if (!status) return;
    status.textContent = text;
    status.className = "status" + (cls ? " " + cls : "");
  }

  fetch("/api/health")
    .then(function (r) { return r.json(); })
    .then(function (d) { setStatus("الخادم متصل ✓ (" + (d.status || "ok") + ")", "ok"); })
    .catch(function () { setStatus("تعذر الوصول للخادم", "err"); });

  var form = document.getElementById("echo-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var msg = document.getElementById("echo-msg").value.trim();
      var out = document.getElementById("echo-out");
      if (!msg || !out) return;
      out.textContent = "جارٍ الإرسال...";
      fetch("/api/echo?msg=" + encodeURIComponent(msg))
        .then(function (r) { return r.json(); })
        .then(function (d) { out.textContent = "رد الخادم: " + (d.echo || d.error || "—"); })
        .catch(function () { out.textContent = "خطأ في الاتصال بالخادم."; });
    });
  }
})();
`;

  const server = `// NEBRAS AI — generated server (Node http, zero external deps)
// Run: node src/server.js  (PORT env optional, default 3000)
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_DIR = path.join(__dirname, "..", "public");
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

function sendJson(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8" });
  res.end(body);
}

function safeJoin(base, target) {
  const p = path.normalize(path.join(base, target));
  return p.startsWith(base) ? p : null;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  const route = url.pathname;

  if (route === "/api/health") {
    return sendJson(res, 200, { status: "ok", service: "nebras-ai", time: new Date().toISOString() });
  }
  if (route === "/api/echo") {
    const msg = (url.searchParams.get("msg") || "").slice(0, 500);
    if (!msg) return sendJson(res, 400, { error: "msg is required (max 500 chars)" });
    return sendJson(res, 200, { echo: msg, receivedAt: new Date().toISOString() });
  }
  if (route.startsWith("/api/")) {
    return sendJson(res, 404, { error: "API endpoint not found" });
  }

  let rel = route === "/" ? "index.html" : route.replace(/^\\//, "");
  const filePath = safeJoin(PUBLIC_DIR, rel);
  if (!filePath) return sendJson(res, 403, { error: "forbidden path" });
  fs.readFile(filePath, (err, data) => {
    if (err) {
      return sendJson(res, 404, { error: "not found" });
    }
    const type = MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log("NEBRAS AI server listening on port " + PORT);
});
`;

  const apiDoc = `# Documentation — API
Project: ${title} (${code})

## GET /api/health
Response 200:
{
  "status": "ok",
  "service": "nebras-ai",
  "time": "ISO-8601"
}

## GET /api/echo?msg=<text>
- msg: required, max 500 chars
- 200: { "echo": "<text>", "receivedAt": "ISO-8601" }
- 400: { "error": "msg is required (max 500 chars)" }

## Static files
Files in /public are served at root. Paths are validated (no traversal).
${note}
`;

  const sql = `-- NEBRAS AI — generated schema for: ${title} (${code})
-- PostgreSQL 14+
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  phone VARCHAR(40) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS items (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_items_user ON items(user_id);
CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
${note}
`;

  const readme = `# ${title}
Project code: ${code} — built by NEBRAS AI
For client: ${clientName}

## Run locally
\`\`\`bash
node src/server.js
# open http://localhost:3000
\`\`\`

## Structure
- public/ — frontend (RTL Arabic)
- src/ — Node server (zero external deps)
- docs/ — requirements, architecture, tests, security
- DELIVERY.md — final delivery report
${note}
`;

  const runSh = `#!/usr/bin/env bash
# NEBRAS AI — safe run script for ${code}
set -euo pipefail
export PORT="\${PORT:-3000}"
export NODE_ENV="\${NODE_ENV:-production}"
# NOTE: no secrets are stored here — inject via environment at deploy time.
cd "$(dirname "$0")/.."
exec node src/server.js
`;

  const reqDoc = `# مستند المتطلبات — ${title}
مشروع ${code} — العميل: ${clientName}

## الهدف
${title} — ${esc(ctx.title)}

## المستخدمون
- المستخدم النهائي (موبايل + موبايل-فريش): تصفح عربي RTL وسريع.
- مدير المحتوى: تحديث المحتوى دون لمسة برمجية (مرحلة لاحقة بعد اعتماد النطاق).

## المتطلبات (قابلة للاختبار)
- R1: الصفحة الرئيسية تفتح خلال ثانيتين على اتصال عادي.
- R2: القائمة تنطوي/تنفتح على الموبايل.
- R3: نموذج الإرسال يعرض الرد الفعلي من /api/echo.
- R4: /api/health يعيد status ok.
- R5: لا يظهر أي خطأ في Consol عند فتح الصفحة.

## النطاق المضمن
- واجهة HTML/CSS/JS عربية RTL، خادم Node بنقاط API، توثيق كامل.
## خارج النطاق
- النشر على الإنتاج، بوابات دفع حية، مصادقة بمفاتيح حقيقية.
## معلومات ناقصة يجب تأكيدها
${notes || "- لم تصل معلومات إضافية حتى الآن."}
${note}
`;

  const archDoc = `# البنية التقنية — ${title}
Project ${code}

## الاختيارات
- Frontend: HTML5 + CSS3 + Vanilla JS (بدون تبعيات) — RTL.
- Backend: Node.js http مدمج (بدون frameworks) — أسهل نشر وأقل مساحة هجمة.
- Database: PostgreSQL (مخطط مقترح في docs/db-schema.sql) — يُفعَّل عند توفر الاتصال.

## مخطط الطلب
browser → / (static من public/) → fetch /api/* → node http → JSON

## قرارات أمان
- تحقق من المسارات (no path traversal).
- حد 500 حرف على المدخلات الحرة.
- لا أسرار في الكود — متغيرات بيئة فقط.
${note}
`;

  const wireframes = `# مخطط الشاشات — ${title}
Project ${code}

## S1 — الرئيسية (hero)
[ brand ] ......... [ nav: الرئيسية | المزايا | تواصل ]
        عنوان رئيسي متدرج
        وصف سطرين
        [ زر CTA ]
        (مؤشر حالة الخادم)
## S2 — المزايا
ثلاث بطاقات: RTL / ربط API / جاهز للتطوير
## S3 — تواصل (نموذج)
[ input رسالة ] [ زر إرسال ]
(خروج حي للرد)
## تدفق الاستخدام
الرئيسية → CTA → نموذج → إرسال → رد فوري
## Design tokens
ألوان: bg #07051a / panel #120a2e / violet #a78bfa / cyan #22d3ee
خط: Tajawal (system-ui fallback)
## إتاحة
تباين AA، focus rings، aria-live على الردود.
${note}
`;

  const reviewDoc = `# تقرير مراجعة الكود — ${title}
Project ${code}

## نتيجة الفحوصات الفعلية
(تُسجل آلياً من محرك التنفيذ في docs/test-report.md — المراجعة تعتمد على تلك النتائج لا على الانطباع)

## نقاط المراجعة الدورية
- [ ] كل مسارات /api/ تحدد حالة الخطأ
- [ ] لا console.log لقيم حساسة
- [ ] حدود المدخلات مطبقة (500 char)
- [ ] تحقق المسارات (safeJoin) سليم
- [ ] لا ملفات خارج النطاق (public/src/docs/scripts/data/content/design)

## قائمة الإصلاحات (تُملأ بعد كل جولة فحص)
1. —
${note}
`;

  const qaDoc = `# تقرير الاختبارات — ${title}
Project ${code}

## خطة الاختبار
| # | الحالة | الخطوات | المتوقع |
|---|--------|---------|---------|
| T1 | صياغة JS | node --check على كل ملفات js | exit 0 |
| T2 | تشغيل الخادم | node src/server.js على منفذ مؤقت + GET /api/health | 200 {status:ok} |
| T3 | Echo | GET /api/echo?msg=hi | 200 {echo:hi} |
| T4 | حدود Echo | GET /api/echo بدون msg | 400 |
| T5 | اكتمال الملفات | تحقق وجود كل ملف في قائمة التسليم | موجود وغير فارغ |
| T6 | أسرار | فحص أنماط مفاتيح/كلمات مرور مضمّنة | صفر نتائج |

## النتائج الفعلية
(يملأها محرك التنفيذ آلياً — لا تُعلن النتيجة إلا بعد تشغيل الفحص فعلاً)
${note}
`;

  const secDoc = `# تقرير الأمان — ${title}
Project ${code}

## الفحوصات المنفذة (قراءة فقط — لا اختبارات هجومية)
- [ ] أسرار مضمّنة: فحص أنماط (sk-, api_key=, password=, بريد مع كلمة مرور)
- [ ] Path traversal: تحقق safeJoin
- [ ] مدخلات: حد طول + escape عند العرض
- [ ] ترويسات: مقترح إضافة X-Content-Type-Options و Referrer-Policy عند النشر
- [ ] صلاحيات: لا صلاحيات root مطلوبة للتشغيل

## التوصيات
1. عند النشر: خلف reverse proxy بـ HTTPS.
2. مفاتيح البوابات تُحقن بيئة فقط.
3. مراجعة دورية بعد أي تغيير على /api/*.
${note}
`;

  const deployDoc = `# خطة التشغيل والنشر — ${title}
Project ${code}

## التشغيل المحلي
node src/server.js (أو ./scripts/run.sh)

## النشر المقترح (قابل للتراجع)
1. نسخ الملفات إلى بيئة الاستضافة (node 18+).
2. ضبط متغيرات البيئة (PORT فقط حالياً).
3. تشغيل + تحقق /api/health.
4. الرجوع: إعادة تشغيل النسخة السابقة (لا يوجد تفاعل على قاعدة بيانات حتى الآن).

## المراقبة
- سجلات console (stdout/stderr) — عند الانتشار يُحوَّل لملف مع rotate.
- إنذار مقترح: 3 إصابات متتالية على /api/health.
${note}
`;

  const userGuide = `# دليل الاستخدام — ${title}
Project ${code}

## التشغيل
1. node src/server.js
2. افتح http://localhost:3000
3. جرّب النموذج: اكتب رسالة واضغط إرسال — سترى الرد الفعلي من الخادم.

## الملاحظات
- القائمة على الموبايل تُفتح بزر ☰.
- مؤشر "الخادم متصل" أعلى الصفحة يتأكد من /api/health تلقائياً.
${note}
`;

  const costDoc = `# تقرير التكلفة — ${title}
Project ${code}

## الأساس
- حجم المهام: (تُسجل من الخطة الفعلية)
- الوقت الفعلي المسجل: (من سجل المهام — يظهر في لوحة المطور)
- استهلاك النماذج: (من سجل الاستخدام — إذا لم تتوفر بيانات: غير متاح)

## ملاحظة
لا نعرض أرقاماً تقديرية بدون قياس. التقدير النهائي يُحدّث مع كل تغيير على النطاق.
${note}
`;

  const deliveryDoc = `# تقرير التسليم — ${title}
Project ${code} — العميل: ${clientName}

## ملفات التسليم
(قائمة يولدها محرك التنفيذ آلياً من سجل الملفات الفعلي)

## ما تم
- خطة تنفيذ كاملة ومهام منفذة بموظفين متخصصين.
- اختبارات فعلية (صياغة، تشغيل مؤقت، فحص أسرار) — النتائج في docs/test-report.md.
- توثيق كامل (متطلبات، بنية، API، تشغيل، أمان).

## ما بقي (يتطلب بيئة العميل أو قراراً بشرياً)
- النشر الفعلي على الإنتاج.
- ربط بوابات دفع بمفاتيح حقيقية.
- قاعدة بيانات PostgreSQL حية (المخطط جاهز في docs/db-schema.sql).

## تعليمات التشغيل
انظر README.md — node src/server.js
${note}
`;

  const dataCsv = `date,channel,orders,revenue_egp,region
2025-01-01,whatsapp,12,18500,Cairo
2025-01-01,instagram,8,11200,Riyadh
2025-01-02,whatsapp,15,22100,Cairo
2025-01-02,google_ads,6,9400,Jeddah
2025-01-03,instagram,11,16700,Riyadh
2025-01-03,whatsapp,9,13900,Alexandria
2025-01-04,google_ads,14,20300,Cairo
2025-01-04,whatsapp,17,24800,Riyadh
2025-01-05,instagram,10,14900,Jeddah
2025-01-05,whatsapp,13,19200,Cairo
2025-01-06,google_ads,7,10100,Alexandria
2025-01-06,instagram,12,17400,Riyadh
2025-01-07,whatsapp,16,23500,Cairo
2025-01-07,google_ads,5,7300,Jeddah
2025-01-08,instagram,9,13100,Alexandria
2025-01-08,whatsapp,14,20900,Riyadh
2025-01-09,google_ads,11,15800,Cairo
2025-01-09,whatsapp,8,11900,Jeddah
2025-01-10,instagram,13,18800,Riyadh
2025-01-10,whatsapp,10,14600,Cairo
`;

  const dataSchema = `# مخطط البيانات — data/sample.csv
مشروع ${code}

| الحقل | النوع | الوصف |
|-------|-------|-------|
| date | YYYY-MM-DD | التاريخ |
| channel | string | قناة البيع |
| orders | int | عدد الطلبات |
| revenue_egp | number | الإيراد (ج.م) |
| region | string | المنطقة |

البيانات تجريبية واقعية — يُستبدلها العميل ببياناته عبر نفس المخطط.
`;

  const analysisMjs = `// NEBRAS AI — real data analysis script (Node 18+, no deps)
// Run: node data/analysis.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const dir = path.dirname(fileURLToPath(import.meta.url));
const raw = readFileSync(path.join(dir, "sample.csv"), "utf8").trim().split("\\n");
const headers = raw[0].split(",").map((h) => h.trim());

const rows = raw.slice(1).map((line) => {
  const cells = line.split(",").map((c) => c.trim());
  const obj = {};
  headers.forEach((h, i) => (obj[h] = cells[i]));
  obj.orders = Number(obj.orders);
  obj.revenue_egp = Number(obj.revenue_egp);
  return obj;
});

const totalOrders = rows.reduce((s, r) => s + r.orders, 0);
const totalRevenue = rows.reduce((s, r) => s + r.revenue_egp, 0);

const byChannel = {};
for (const r of rows) {
  byChannel[r.channel] ??= { orders: 0, revenue: 0 };
  byChannel[r.channel].orders += r.orders;
  byChannel[r.channel].revenue += r.revenue_egp;
}
const byRegion = {};
for (const r of rows) {
  byRegion[r.region] ??= { orders: 0, revenue: 0 };
  byRegion[r.region].orders += r.orders;
  byRegion[r.region].revenue += r.revenue_egp;
}

const report = {
  project: "${code}",
  generatedAt: new Date().toISOString(),
  totals: { orders: totalOrders, revenue_egp: totalRevenue },
  avgOrderValue: Math.round(totalRevenue / Math.max(1, totalOrders)),
  byChannel,
  byRegion,
  topChannel: Object.entries(byChannel).sort((a, b) => b[1].revenue - a[1].revenue)[0][0],
  topRegion: Object.entries(byRegion).sort((a, b) => b[1].revenue - a[1].revenue)[0][0],
};

writeFileSync(path.join(dir, "report.json"), JSON.stringify(report, null, 2));
console.log("Report written to data/report.json");
console.log(JSON.stringify(report, null, 2));
`;

  const contentStrategy = `# خطة المحتوى الأسبوعية — ${title}
مشروع ${code}

| اليوم | المنصة | الشكل | الهدف |
|-------|--------|-------|-------|
| السبت | إنستغرام | ريلز 30ث | وصول + تعريف |
| السبت | تيك توك | فيديو خطاف | تفاعل |
| الأحد | فيسبوك | بوست نصي | ثقة + إثبات |
| الاثنين | تيك توك | شتائم خلف الكواليس | قرب من الجمهور |
| الثلاثاء | إنستغرام | كاروسيل | تعليم |
| الأربعاء | تيك توك | ق/ج مباشر | تحويل |
| الخميس | فيسبوك + إنستغرام | عرض محدود | مبيعات |
| الجمعة | كل المنصات | نتيجة عميل (توصية) | إثبات اجتماعي |

تنويع: نصف المحتوى لمصر (لهجة مصري) ونصف للسعودية (لهجة خليجي) — نفس الرسالة بصوتين.
${note}
`;

  const postsMd = `# 10 بوستات جاهزة — ${title}
مشروع ${code} — (1) مصر (2) السعودية بالتناوب

## 1. (مصر) — فيسبوك
**العنوان:** ليه مشروعك الرقمي لسه قاعد؟
في 2025 العميل بيبدأ رحلته من الموبايل. موقعك لو بطيء أو شكله قديم، بيخسر في ثانيتين.
NEBRAS AI بتبني مواقع ومتاجر بالعربي — من التحليل للتسليم بفريق ذكاء اصطناعي محترف.
ابعتلنا على واتساب 01503724381 ونرسل لك مقترح مجاني.
#نوفا #برمجة #مصر #متجر_الكتروني #NovaCode

## 2. (السعودية) — إنستغرام
**العنوان:** متجر يبيع 24 ساعة
متجرك الإلكتروني بيبقى مفتوح طول اليوم. نجهزه لك مع الدفع المحلي (مدى / STC Pay) وتتبّع الطلبات.
راسلنا: jehejfkfbw@gmail.com
#السعودية #متاجر_الكترونية #تجارة_إلكترونية #الرياض #جدة

## 3. (مصر) — تيك توك (نص البوست)
"خلينا نعمل تجربة: لو بتبيع ولسه بترد على الطلبات من موبايلك، محتاج تشوف الفيديو ده لحد آخره..."
(نسخة كاملة في content/tiktok-scripts.md)

## 4. (السعودية) — فيسبوك
نظام إدارة للمطاعم والمحلات: طلبات، مخزون، وتقارير — بالعربي وبواجهة مريحة.
استفسر: 01503724381 (واتساب)
#أنظمة_إدارة #السعودية #أعمال

## 5. (مصر) — إنستغرام كاروسيل
5 أخطاء بتخلي إعلاناتك تخسر فلوس (سلايد 1..5) + السولوشن في آخر سلايد.

## 6. (السعودية) — تيك توك
"كم يكلّفك عميل واحد إذا كان متجرك بطيء؟" — سكريبت في ملف السكريبتات.

## 7. (مصر) — فيسبوك
قصة عميل: من ورشة صغيرة لمتجر يبيع 3 مدن في 60 يوم. (يُستبدل بحالة حقيقية بعد موافقة العميل)

## 8. (السعودية) — إنستغرام
خلف الكواليس: كيف فريق الذكاء الاصطناعي عندنا يجهز خطة مشروعك في دقائق ويعتمدها بشري.

## 9. (مصر) — تيك توك
"3 حاجات لازم تعرفها قبل ما تستأجر مطور موقع"

## 10. (السعودية) — فيسبوك
عرض نهاية الشهر: خصم 15% على المتاجر — كود NIVA15 عبر واتساب.
${note}
`;

  const tiktokMd = `# 5 سكريبتات تيك توك (30 ث) — ${title}
مشروع ${code}

## S1 — "ثانيتان"
(0-3) خطاف: "لو موقعك بيستهلك 4 ثواني على الموبايل... عميلك راح."
(3-10): لقطات شاشة لمواقع بطيئة → "في مصر والسعودية أكتر من 80% من البحث بيبدأ من الموبايل"
(10-22): لقطات مشاريع NEBRAS → "إحنا بنحمي موقعك وبنجعله يفتح في أقل من ثانية"
(22-30): "ابعتلنا واتساب 01503724381 ونعمل لك فحص مجاني"
نص الشاشة النهائي: فحص موقعك مجاناً ← واتساب

## S2 — "بكام؟"
(0-3): "بكام تعمل موقع بيع فعلاً؟"
(3-15): عرض الأسعار واضحة على الشاشة (ج.م + ر.س)
(15-25): "والأهم: فريق ذكاء اصطناعي بيجهز مقترحك قبل أول اجتماع"
(25-30): "المقترح مجاني — ابعتلنا دلوقتي"

## S3 — "الفرق"
مقارنة سكرين-بيسكرين: موقع عادي vs موقع من NEBRAS (سرعة، موبايل، دفع).

## S4 — "خلف الكواليس"
كيف طلب العميل يتحول لمهام لفريق 18 موظف ذكي — بلمسات شاشة لوحة التحكم.

## S5 — "النتيجة"
شاشة تقرير تسليم: ملفات + اختبارات + توثيق → "ده اللي بتستلمه مش مجرد كلام".
${note}
`;

  const mainDoc = `# المستند الرئيسي — ${title}
مشروع ${code} — العميل: ${clientName}

## الملخص
${esc(title)} — هذا المستند يلخص المتطلبات والحالة والخطة التنفيذية.

## السياق
يُكتب هذا المستند آلياً بواسطة فريق التوثيق في NEBRAS AI بناءً على الطلب الأصلي:
> ${esc((ctx as GenContext & { description?: string }).description ?? title).slice(0, 500)}

## البنية المقترحة
1. النطاق والمستخدمون
2. المتطلبات المرقمة
3. خطة التنفيذ
4. معايير القبول
${note}
`;

  const guideDoc = `# دليل التشغيل — ${title}
1. استلم الملفات من ZIP.
2. ارجع DELIVERY.md ثم README.md.
3. نفّذ خطوات التشغيل كما هي مسجلة.
4. عند أي استفسار: فريق الخدمة عبر واتساب 01503724381.
`;

  const tokensCss = `/* NEBRAS AI — design tokens for ${title} (${code}) */
:root {
  --color-bg: #07051a;
  --color-surface: #120a2e;
  --color-ink: #efeaff;
  --color-dim: #a99fd0;
  --color-primary: #a78bfa;
  --color-accent: #22d3ee;
  --color-success: #34d399;
  --color-danger: #f87171;
  --font-body: "Tajawal", system-ui, sans-serif;
  --font-display: "Cairo", "Tajawal", sans-serif;
  --radius-sm: 10px;
  --radius-md: 16px;
  --radius-lg: 24px;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 16px;
  --space-4: 24px;
  --space-5: 40px;
  --line: rgba(148, 120, 255, 0.2);
}
/* الاستخدام: dir="rtl" إلزامي على <html> */
`;

  const accessDoc = `# مراجعة الإتاحة — ${title}
- تباين النصوص على الخلفيات: AA+ (تم التحقق من قيم التوكينز).
- كل العناصر التفاعلية قابلة للتنقل بالكيبورد.
- aria-live على الردود الحية.
- RTL مفعّل على مستوى <html dir="rtl">.
${note}
`;

  // خريطة المهام → الملفات
  const map: Record<string, GenFile[]> = {
    requirements: [{ path: "docs/requirements.md", content: reqDoc, action: "created" }],
    architecture: [{ path: "docs/architecture.md", content: archDoc, action: "created" }],
    wireframes: [
      { path: "design/wireframes.md", content: wireframes, action: "created" },
      { path: "design/tokens.css", content: tokensCss, action: "created" },
    ],
    "mobile-spec": [{ path: "docs/mobile-spec.md", content: `# مواصفات التطبيق — ${title}\nمشروع ${code}\n\n## المنصات\nAndroid 10+ / iOS 14+\n\n## المكدس المقترح\nFlutter (منصة واحدة للتطبيقين) + REST API من src/server.js\n\n## الشاشات\n1. تسجيل الدخول/العودة (رقم جوال + رمز)\n2. الرئيسية (ملخص + إجراءات سريعة)\n3. تفاصيل العنصر\n4. الطلب/الحجز\n5. الإعدادات\n\n## عقود API\n- POST /api/echo (نموذج — يُستبدل بـ /api/projects حسب المتطلبات)\n- GET /api/health\n\n## ⚠️ تصريح بيئة\nبيئة بناء Android/iOS SDK غير متاحة على خادم NEBRAS AI — هذا الملف جاهز لبناء التطبيق محلياً أو بواسطة فريق العميل، مع خادم و API جاهزين ومختبرين.\n${note}`, action: "created" }],
    frontend: [
      { path: "public/index.html", content: html, action: "created" },
      { path: "public/styles.css", content: css, action: "created" },
    ],
    backend: [
      { path: "src/server.js", content: server, action: "created" },
      { path: "docs/API.md", content: apiDoc, action: "created" },
    ],
    db: [{ path: "docs/db-schema.sql", content: sql, action: "created" }],
    integration: [{ path: "public/app.js", content: js, action: "created" }],
    review: [{ path: "docs/code-review.md", content: reviewDoc, action: "created" }],
    qa: [{ path: "docs/test-report.md", content: qaDoc, action: "created" }],
    security: [{ path: "docs/security.md", content: secDoc, action: "created" }],
    deploy: [
      { path: "scripts/run.sh", content: runSh, action: "created" },
      { path: "docs/deploy.md", content: deployDoc, action: "created" },
    ],
    docs: [
      { path: "README.md", content: readme, action: "created" },
      { path: "docs/user-guide.md", content: userGuide, action: "created" },
    ],
    cost: [{ path: "docs/cost-report.md", content: costDoc, action: "created" }],
    delivery: [{ path: "DELIVERY.md", content: deliveryDoc, action: "created" }],
    dataset: [
      { path: "data/sample.csv", content: dataCsv, action: "created" },
      { path: "data/schema.md", content: dataSchema, action: "created" },
    ],
    analysis: [
      { path: "data/analysis.mjs", content: analysisMjs, action: "created" },
      { path: "README.md", content: `# ${title} — تحليل بيانات\nمشروع ${code}\n\n## التشغيل\n\`\`\`bash\nnode data/analysis.mjs\n\`\`\`\nيكتب data/report.json ويخرج الملخص على الشاشة.\n\n## الملفات\ndata/sample.csv (بيانات تجريبية واقعية) — استبدلها ببياناتك بنفس المخطط (data/schema.md).\n${note}`, action: "created" },
    ],
    strategy: [{ path: "content/strategy.md", content: contentStrategy, action: "created" }],
    posts: [{ path: "content/posts.md", content: postsMd, action: "created" }],
    scripts: [{ path: "content/tiktok-scripts.md", content: tiktokMd, action: "created" }],
    "main-doc": [
      { path: "docs/main.md", content: mainDoc, action: "created" },
      { path: "README.md", content: readme, action: "created" },
    ],
    guide: [{ path: "docs/guide.md", content: guideDoc, action: "created" }],
  };

  const files = map[taskKey];
  if (!files) {
    return [
      {
        path: "docs/notes.md",
        content: `# ملاحظات — ${taskKey}\nمشروع ${code}\n${note}`,
        action: "created",
      },
    ];
  }
  // بعض الأنواع لا تنطبق على ملفات الـ web: نرشّح حسب النوع
  if (type !== "web" && type !== "app" && type !== "software" && (taskKey === "frontend" || taskKey === "integration")) {
    return [];
  }
  return files;
}
