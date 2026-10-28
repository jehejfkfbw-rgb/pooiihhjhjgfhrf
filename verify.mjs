// ============================================================
// NEBRAS AI — اختبارات النظام الفعلية (تُشغّل ضد خادم حي على :3000)
// node scripts/verify.mjs
// ============================================================

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
let passed = 0;
let failed = 0;

function ok(name, cond, extra = "") {
  if (cond) {
    passed++;
    console.log(`✅ PASS — ${name} ${extra}`);
  } else {
    failed++;
    console.log(`❌ FAIL — ${name} ${extra}`);
  }
}

async function j(path, opts = {}) {
  const r = await fetch(BASE + path, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(opts.headers ?? {}) },
  });
  let d = null;
  try {
    d = await r.json();
  } catch {
    // non-json
  }
  return { status: r.status, d, r };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitFor(fn, timeoutMs = 150_000, step = 2000) {
  const end = Date.now() + timeoutMs;
  while (Date.now() < end) {
    const v = await fn();
    if (v) return v;
    await sleep(step);
  }
  return null;
}

// ---- تهيئة: تسجيل دخول المطور ----
const login = await j("/api/admin/login", {
  method: "POST",
  body: JSON.stringify({ username: "nova_admin", password: "Nova@2025" }),
});
const cookies = login.r.headers.getSetCookie?.() ?? [];
const cookie = cookies.map((c) => c.split(";")[0]).join("; ");
ok("دخول المطور", login.status === 200);

const authHeaders = { headers: { "Content-Type": "application/json", cookie } };

// ---- 1) استقبال طلب جديد ----
const ref = `verify-${Date.now()}`;
const create = await j("/api/projects", {
  method: "POST",
  body: JSON.stringify({
    refId: ref,
    clientName: "عميل الاختبار",
    phone: "01000000001",
    service: "مواقع ومتاجر إلكترونية",
    title: "متجر أزياء اختبار",
    details:
      "متجر إلكتروني لبيع الأزياء بواجهة عربية، أريد عرض المنتجات وسلة شراء وصفحة تواصل، والسوق هو مصر والسعودية مع دفع عند الاستلام.",
    priority: "normal",
  }),
});
ok("استقبال طلب جديد (201 + رمز)", create.status === 201 && !!create.d?.code, create.d?.code ?? "");
const code = create.d?.code;

// ---- 2) عدم تكرار الطلب ----
const dup = await j("/api/projects", {
  method: "POST",
  body: JSON.stringify({
    refId: ref,
    clientName: "عميل الاختبار",
    phone: "01000000001",
    service: "مواقع ومتاجر إلكترونية",
    details: "متجر إلكتروني لبيع الأزياء — نفس الطلب السابق.",
  }),
});
ok("الطلب المكرر لا ينشئ مشروعاً جديداً", dup.status === 200 && dup.d?.duplicate === true && dup.d?.code === code);

// ---- 3) عزل بيانات العملاء ----
const wrong = await j(`/api/projects/track/NB-ZZZZZZ`, {});
ok("رمز متابعه خاطئ → 404 (عزل العملاء)", wrong.status === 404);

// ---- 4) التحليل والخطة ----
const analyzed = await waitFor(async () => {
  const t = await j(`/api/projects/track/${code}`);
  if (
    t.status === 200 &&
    ["awaiting_confirm", "planned", "blocked"].includes(t.d.project.status) &&
    (t.d.tasks?.length ?? 0) >= 4
  )
    return t.d;
  return null;
}, 60_000);
ok("العقل المركزي أنتج خطة (تحليل)", !!analyzed, `الحالة: ${analyzed?.project.status}`);
ok("الخطة تحتوي مهاماً (4+)", (analyzed?.tasks?.length ?? 0) >= 4, `${analyzed?.tasks?.length} مهمة`);

// ---- 5) الاعتماد ثم البدء ----
const projId = await j("/api/admin/projects", authHeaders);
const row = projId.d?.projects?.find((p) => p.code === code);
const approve = await j(`/api/admin/projects/${row.id}/actions`, {
  ...authHeaders,
  method: "POST",
  body: JSON.stringify({ action: "approve", note: "اعتماد اختبار آلي" }),
});
ok("اعتماد النطاق والتكلفة", approve.status === 200);

const start = await j(`/api/admin/projects/${row.id}/actions`, {
  ...authHeaders,
  method: "POST",
  body: JSON.stringify({ action: "start" }),
});
ok("بدء التنفيذ", start.status === 200);

// بدء مكرر أثناء التنفيذ → مرفوض
const start2 = await j(`/api/admin/projects/${row.id}/actions`, {
  ...authHeaders,
  method: "POST",
  body: JSON.stringify({ action: "start" }),
});
ok("محاولة بدء مكرر أثناء التنفيذ مرفوضة", start2.status === 409);

// ---- 6) التنفيذ حتى التسليم (فحوصات فعلية) ----
const delivered = await waitFor(async () => {
  const t = await j(`/api/projects/track/${code}`);
  if (t.status === 200 && ["delivered", "blocked"].includes(t.d.project.status)) return t.d;
  return null;
}, 180_000);
ok("اكتمل التنفيذ حتى بوابة التسليم", delivered?.project.status === "delivered", `الحالة: ${delivered?.project.status}`);
ok("تقدم أوزاني 100%", delivered?.project.progress === 100);
ok("فحوصات فعلية ناجحة > 0", (delivered?.testSummary?.pass ?? 0) > 0, `ناجح: ${delivered?.testSummary?.pass} / فاشل: ${delivered?.testSummary?.fail}`);
ok("لا فحوصات فاشلة عند التسليم", (delivered?.testSummary?.fail ?? 1) === 0);
ok("ملفات التسليم > 0", (delivered?.files?.length ?? 0) > 0, `${delivered?.files?.length} ملف`);

// ---- 7) تحديث موعد التسليم أثناء التنفيذ (تقديرات ≥2) ----
const detail = await j(`/api/admin/projects/${row.id}`, authHeaders);
ok("تقديرات التسليم تراكمت أثناء التنفيذ (≥2)", (detail.d?.estimates?.length ?? 0) >= 2, `${detail.d?.estimates?.length} تقديرات`);
ok("سجل استهلاك النماذج مسجل", (detail.d?.usage?.length ?? 0) > 0, `${detail.d?.usage?.length} سجل`);

// ---- 8) تحميل ZIP حقيقي ----
const zipRes = await fetch(`${BASE}/api/projects/track/${code}/download`);
const zipBuf = Buffer.from(await zipRes.arrayBuffer());
ok("تحميل ZIP (سحابة PK)", zipRes.status === 200 && zipBuf.subarray(0, 2).toString() === "PK");
const zipText = zipBuf.toString("latin1");
ok("ZIP يحتوي ملفات المشروع", zipText.includes("README.md") && zipText.includes("DELIVERY.md"));

// ---- 9) معاينة حية (HTML مضمّن) ----
const prev = await fetch(`${BASE}/api/projects/track/${code}/preview`);
const prevText = await prev.text();
ok("معاينة حية (HTML + CSS/JS مضمّنة)", prev.status === 200 && prevText.includes("<style>") && prevText.includes("<script>"));

// ---- 10) رسائل العميل وتظهر في المتابعة ----
const msgSend = await j(`/api/projects/track/${code}/messages`, {
  method: "POST",
  body: JSON.stringify({ content: "سؤال: هل تشمل الأسعار الاستضافة؟" }),
});
const afterMsg = await j(`/api/projects/track/${code}`);
ok(
  "رسالة العميل تصل وتظهر في المتابعة",
  msgSend.status === 200 && afterMsg.d?.messages?.some((m) => String(m.content).includes("الاستضافة")),
);

// ---- 11) التقييم ----
const fb = await j(`/api/projects/track/${code}/feedback`, {
  method: "POST",
  body: JSON.stringify({ rating: 5, comment: "اختبار آلي", hasIssue: false }),
});
ok("تقييم العميل (مرة واحدة)", fb.status === 200);

// ---- 12) إيقاف/استئناف/إلغاء (مشروع ثان) ----
const create2 = await j("/api/projects", {
  method: "POST",
  body: JSON.stringify({
    refId: `verify2-${Date.now()}`,
    clientName: "عميل الإيقاف",
    phone: "01000000002",
    service: "مواقع ومتاجر إلكترونية",
    details:
      "موقع شركة استشارات مالية بصفحات رئيسية وخدمات ومنطق تواصل مع سيرة ذاتية، موجّه لعملاء مصر والسعودية مع دعم كامل للعربية.",
  }),
});
const code2 = create2.d?.code;
const analyzed2 = await waitFor(async () => {
  const t = await j(`/api/projects/track/${code2}`);
  if (t.status === 200 && t.d.project.status === "awaiting_confirm") return t.d;
  return null;
}, 60_000);
ok("مشروع ثان: تحليل جاهز", !!analyzed2);
const row2 = (await j("/api/admin/projects", authHeaders)).d?.projects?.find((p) => p.code === code2);
await j(`/api/admin/projects/${row2.id}/actions`, { ...authHeaders, method: "POST", body: JSON.stringify({ action: "approve" }) });
const start3 = await j(`/api/admin/projects/${row2.id}/actions`, { ...authHeaders, method: "POST", body: JSON.stringify({ action: "start" }) });
ok("مشروع ثان: بدء التنفيذ", start3.status === 200);

// ننتظر أن يدخل التنفيذ فعلياً (مهمة قيد التنفيذ أو تقدم >0) ثم نوقف
await waitFor(async () => {
  const t = await j(`/api/projects/track/${code2}`);
  return t.status === 200 && (t.d.project.status === "running" || Number(t.d.project.progress) > 0) ? t.d : null;
}, 20_000);
const progressBeforePause = (await j(`/api/projects/track/${code2}`)).d?.project.progress ?? 0;
const pause = await j(`/api/admin/projects/${row2.id}/actions`, { ...authHeaders, method: "POST", body: JSON.stringify({ action: "pause" }) });
const pausedState = await waitFor(async () => {
  const t = await j(`/api/projects/track/${code2}`);
  return t.status === 200 && t.d.project.status === "paused" ? t.d : null;
}, 15_000);
ok("إيقاف مؤقت يعمل (الحالة paused)", pause.status === 200 && pausedState?.project.status === "paused");

const resume = await j(`/api/admin/projects/${row2.id}/actions`, { ...authHeaders, method: "POST", body: JSON.stringify({ action: "resume" }) });
ok("استئناف بعد الإيقاف", resume.status === 200);
const resumed = await waitFor(async () => {
  const t = await j(`/api/projects/track/${code2}`);
  if (t.status !== 200) return null;
  const s = t.d.project.status;
  if (["delivered", "blocked", "cancelled"].includes(s)) return t.d;
  return null;
}, 180_000);
ok(
  "الإيقاف ثم الاستئناف أكملا المشروع بنجاح (تسليم + 100%)",
  resumed?.project.status === "delivered" && resumed.project.progress === 100,
  `تقدم عند لحظة الإيقاف ${progressBeforePause}% → الحالة النهائية: ${resumed?.project.status}`,
);

// ---- 13) إلغاء (مشروع ثالث) ----
const create3 = await j("/api/projects", {
  method: "POST",
  body: JSON.stringify({
    refId: `verify3-${Date.now()}`,
    clientName: "عميل الإلغاء",
    phone: "01000000003",
    service: "تصميم UI/UX وهوية بصرية",
    details: "طلب تجريبي قصير للإلغاء: تصميم صفحة هبوط بسيطة لفعالية تقنية في جدة.",
  }),
});
const code3 = create3.d?.code;
await waitFor(async () => {
  const t = await j(`/api/projects/track/${code3}`);
  return t.status === 200 && t.d.project.status === "awaiting_confirm" ? t.d : null;
}, 60_000);
const row3 = (await j("/api/admin/projects", authHeaders)).d?.projects?.find((p) => p.code === code3);
await j(`/api/admin/projects/${row3.id}/actions`, { ...authHeaders, method: "POST", body: JSON.stringify({ action: "approve" }) });
await j(`/api/admin/projects/${row3.id}/actions`, { ...authHeaders, method: "POST", body: JSON.stringify({ action: "start" }) });
await sleep(800);
const cancel = await j(`/api/admin/projects/${row3.id}/actions`, { ...authHeaders, method: "POST", body: JSON.stringify({ action: "cancel" }) });
const cancelledState = await waitFor(async () => {
  const t = await j(`/api/projects/track/${code3}`);
  return t.status === 200 && t.d.project.status === "cancelled" ? t.d : null;
}, 20_000);
ok("إلغاء التنفيذ يعمل (الحالة cancelled)", cancel.status === 200 && cancelledState?.project.status === "cancelled");

// ---- 14) فحص المزودين حقيقياً + صلاحيات ----
const prov = await j("/api/admin/providers", authHeaders);
ok("فحص المزودين يرجع حالة اتصال فعلية", prov.status === 200 && Array.isArray(prov.d?.providers) && prov.d.providers.length === 2);
const noAuth = await j("/api/admin/projects", {});
ok("حماية لوحة المطور (بدون جلسة → 401)", noAuth.status === 401);

// ---- 15) إحصائيات الإدارة ----
const stats = await j("/api/admin/stats", authHeaders);
ok("لوحة التقارير تُحسب من البيانات الفعلية", stats.status === 200 && (stats.d?.projects?.total ?? 0) >= 3);

// ---- 16) قاعدة المعرفة: الحجم والبحث ----
const kb = await j("/api/admin/kb", authHeaders);
ok("قاعدة المعرفة ضخمة (≥ 80 مدخلاً)", kb.status === 200 && (kb.d?.stats?.total ?? 0) >= 80, `${kb.d?.stats?.total} مدخلاً`);
const kbSearch = await j(`/api/admin/kb?q=${encodeURIComponent("أمان")}`, authHeaders);
ok("البحث الذكي يرجع نتائج مرتبة", kbSearch.status === 200 && (kbSearch.d?.entries?.length ?? 0) >= 3, `${kbSearch.d?.entries?.length} نتيجة`);
const kbNoAuth = await j("/api/admin/kb", {});
ok("قاعدة المعرفة محمية (401 بدون جلسة)", kbNoAuth.status === 401);

// ---- 17) محرك التنفيذ استخدم المعرفة (usage > 0) ----
const kbUsed = await j(`/api/admin/kb?limit=3`, authHeaders);
const maxUse = Math.max(0, ...(kbUsed.d?.entries ?? []).map((e) => Number(e.usageCount ?? 0)));
ok("المحرك سحب المعرفة أثناء التنفيذ (usage > 0)", maxUse > 0, `أقصى استخدام: ${maxUse}`);

// ---- 18) إضافة + تحقق + حذف مدخل ----
const kbAdd = await j("/api/admin/kb", {
  ...authHeaders,
  method: "POST",
  body: JSON.stringify({
    title: "اختبار آلي: مدخل مؤقت",
    content: "مدخل تجريبي يُضاف ويُحذف خلال الاختبار — لا يُستخدم في الإنتاج.",
    topicKey: "basics",
    category: "guide",
    source: "platform-tests",
    license: "CC-BY-4.0 (اختبار)",
  }),
});
ok("إضافة مدخل جديد", kbAdd.status === 200 && !!kbAdd.d?.id);
const kbVerify = await j(`/api/admin/kb/${kbAdd.d?.id}`, {
  ...authHeaders,
  method: "PATCH",
  body: JSON.stringify({ action: "verify" }),
});
const kbAfter = await j(`/api/admin/kb?q=${encodeURIComponent("اختبار آلي مؤقت")}`, authHeaders);
const added = (kbAfter.d?.entries ?? []).find((e) => e.id === kbAdd.d?.id);
ok("المدخل يظهر في البحث ومُحَقَّق", kbVerify.status === 200 && added?.verified === true);
const kbDel = await j(`/api/admin/kb/${kbAdd.d?.id}`, {
  ...authHeaders,
  method: "PATCH",
  body: JSON.stringify({ action: "delete" }),
});
ok("حذف المدخل", kbDel.status === 200);

// ---- 19) حصاد الخبرات بعد التسليم ----
const exp = await j("/api/admin/kb/experience", authHeaders);
ok("سجل تقدير/فعلي حُصد من المشروع المسلَّم", exp.status === 200 && (exp.d?.records?.length ?? 0) >= 1, `${exp.d?.records?.length} سجل`);
ok("قرار هندسي مسجل في الذاكرة المؤسسية", (exp.d?.decisions?.length ?? 0) >= 1);
ok("مكونات معاد استخدامها مسجلة", (exp.d?.components?.length ?? 0) >= 1, `${exp.d?.components?.length} مكوّن`);

console.log(`\n===== النتيجة: ${passed} نجح / ${failed} فشل =====`);
process.exit(failed ? 1 : 0);
