// ============================================================
// NEBRAS AI CORE — تحليل الطلب وتحويله إلى خطة مهام
// - يحاول النموذج أولاً (JSON صارم)، ثم المُخطِّط المحلي البديل
// - يحدد القدرات الفعلية ولا يدّعي تنفيذ ما لا تتيحُه الأدوات
// ============================================================

import { askModel } from "@/lib/model";
import { calibrateEstimate, relevantLessons } from "./kb";

export type ServiceType =
  | "web"
  | "app"
  | "software"
  | "docs"
  | "content"
  | "data"
  | "design"
  | "other";

export interface PlanTask {
  seq: number;
  key: string;
  title: string;
  agentRole: string;
  weightMin: number;
  dependsOn: number[];
  instructions: string;
}

export interface ProjectPlan {
  feasibility: "supported" | "partial" | "not_supported";
  capabilityNote: string;
  missingInfo: string[];
  scopeIn: string[];
  scopeOut: string[];
  assumptions: string[];
  tasks: PlanTask[];
  estLowMin: number;
  estHighMin: number;
  costNote: string;
  source: "model" | "local";
}

const TYPE_LABEL: Record<ServiceType, string> = {
  web: "موقع / متجر إلكتروني (HTML/CSS/JS + خادم Node)",
  app: "تطبيق موبايل (مواصفات + بنية + API — بيئة البناء غير متاحة على الخادم)",
  software: "برمجيات / نظام إدارة (خادم Node + SQL + واجهات)",
  docs: "مستندات وتوثيق فني",
  content: "محتوى تسويقي (بوستات، سكريبتات، خطة نشر)",
  data: "تحليل بيانات (سكريبتات Node فعلية + تقرير)",
  design: "تصميم UI/UX (مواصفات + tokens + wireframes)",
  other: "مشروع مخصص (خطة + مستندات + مخرجات نصية)",
};

export const CAPABILITIES = `القدرات الفعلية المتاحة في بيئة التنفيذ الحالية:
- إنشاء/تعديل ملفات نصية (HTML, CSS, JS/TS, SQL, Markdown, JSON, shell).
- تشغيل فحوصات آمنة محددة: فحص صياغة node --check، فحص وجود الملفات، فحص أسرار مضمّنة، وتشغيل خادم Node مؤقت على منفذ داخلي للاختبار الوظيفي.
- كتابة مستندات ومحتوى ومخططات SQL.
غير متاح: بناء حزم Android/iOS، الوصول لأنظمة خارجية أو حسابات العميل، عمليات مالية، نشر فعلية على الإنتاج، أو أي أوامر طرفية غير محددة مسبقاً — هذه تُوثق وتُحال للمطور البشري.`;

// ------------------------------------------------------------
// المُخطِّط المحلي (قوالب مهام حقيقية لكل نوع مشروع)
// ------------------------------------------------------------

function webTasks(): PlanTask[] {
  return [
    { seq: 1, key: "requirements", title: "متطلبات وقابل للاختبار", agentRole: "analyst", weightMin: 10, dependsOn: [], instructions: "اكتب docs/requirements.md: أهداف، مستخدمون، متطلبات مرقمة قابلة للاختبار، نطاق مضمن/محذوف، ومعلومات ناقصة." },
    { seq: 2, key: "architecture", title: "البنية التقنية", agentRole: "architect", weightMin: 8, dependsOn: [1], instructions: "اكتب docs/architecture.md: اختيار التقنيات (HTML/CSS/JS + Node http مدمج)، مخطط الطلب، قرارات أمان." },
    { seq: 3, key: "wireframes", title: "تصميم الشاشات والتدفقات", agentRole: "uiux", weightMin: 8, dependsOn: [1], instructions: "اكتب design/wireframes.md: مخطط الشاشات RTL، تدفق الاستخدام، ونظام ألوان وخطوط (design-tokens)." },
    { seq: 4, key: "frontend", title: "بناء الواجهة الأمامية", agentRole: "frontend", weightMin: 14, dependsOn: [2, 3], instructions: "أنشئ public/index.html و public/styles.css: واجهة عربية RTL كاملة (روابط داخلية للأقسام) متجاوبة وسريعة، تشير لـ app.js و styles.css." },
    { seq: 5, key: "backend", title: "الخادم وواجهات API", agentRole: "backend", weightMin: 14, dependsOn: [2], instructions: "أنشئ src/server.js: خادم Node (http مدمج بدون تبعيات) يقدّم الملفات الثابتة من public/ مع endpoints: GET /api/health و GET /api/echo?msg= — تحقق مدخلات ورسائل خطأ آمنة. واكتب docs/API.md." },
    { seq: 6, key: "db", title: "تصميم قاعدة البيانات", agentRole: "database", weightMin: 8, dependsOn: [2], instructions: "اكتب docs/db-schema.sql: جداول PostgreSQL (منتجات/طلبات/مستخدمين) بمفاتيح وفهارس وتعليقات." },
    { seq: 7, key: "integration", title: "ربط الواجهة بالخادم", agentRole: "fullstack", weightMin: 10, dependsOn: [4, 5], instructions: "أنشئ public/app.js: سلوك الصفحة (قائمة موبايل، نموذج تواصل يتصل بـ /api/echo ويعرض الرد، حالة تحميل وخطأ) — vanilla JS." },
    { seq: 8, key: "review", title: "مراجعة الكود", agentRole: "reviewer", weightMin: 8, dependsOn: [7], instructions: "اكتب docs/code-review.md: مراجعة الملفات المنتجة (ستصلك نتائج الفحوصات) مع قائمة إصلاحات بالأولوية." },
    { seq: 9, key: "qa", title: "اختبار شامل", agentRole: "qa", weightMin: 12, dependsOn: [7, 8], instructions: "شغّل خطة الاختبار: صياغة JS، عمل الخادم الوظيفي، اكتمال الملفات، واكتب docs/test-report.md بالنتائج الفعلية." },
    { seq: 10, key: "security", title: "فحص الأمان", agentRole: "security", weightMin: 8, dependsOn: [9], instructions: "افحص الملفات (أسرار مضمّنة، حقن، ترويسات) واكتب docs/security.md بالتوصيات." },
    { seq: 11, key: "deploy", title: "خطة التشغيل والنشر", agentRole: "devops", weightMin: 8, dependsOn: [9], instructions: "أنشئ scripts/run.sh (تشغيل آمن مع متغيرات بيئة بدون قيم حقيقية) و docs/deploy.md قابلة للتراجع." },
    { seq: 12, key: "docs", title: "التوثيق الكامل", agentRole: "docs", weightMin: 10, dependsOn: [8], instructions: "اكتب README.md (تثبيت وتشغيل فعلي) و docs/user-guide.md دليل استخدام بالعربية." },
    { seq: 13, key: "cost", title: "تقدير التكلفة النهائي", agentRole: "cost", weightMin: 6, dependsOn: [9], instructions: "اكتب docs/cost-report.md: تقدير التكلفة من حجم المهام والوقت الفعلي؛ البيانات غير المتوفرة اكتب «غير متاح»." },
    { seq: 14, key: "delivery", title: "تحضير التسليم", agentRole: "delivery", weightMin: 8, dependsOn: [10, 11, 12, 13], instructions: "اكتب DELIVERY.md: قائمة ملفات التسليم، ما تم وما بقي، نتائج الاختبارات، وتعليمات التشغيل." },
  ];
}

function appTasks(): PlanTask[] {
  return [
    { seq: 1, key: "requirements", title: "متطلبات التطبيق", agentRole: "analyst", weightMin: 10, dependsOn: [], instructions: "اكتب docs/requirements.md: استخدامات أساسية، مستخدمون، متطلبات مرقمة، ومعلومات ناقصة." },
    { seq: 2, key: "architecture", title: "البنية التقنية للتطبيق", agentRole: "architect", weightMin: 8, dependsOn: [1], instructions: "اكتب docs/architecture.md: بنية التطبيق (Flutter/React Native) + خادم Node، عقود API، تخزين محلي." },
    { seq: 3, key: "mobile-spec", title: "مواصفات التطبيق للشاشات", agentRole: "mobile", weightMin: 12, dependsOn: [2], instructions: "اكتب docs/mobile-spec.md: شاشات التطبيق بالتفصيل، تدفقات، وإعدادات البناء المتبقية يدوياً (بيئة Android/iOS غير متاحة على الخادم — صرّح بذلك)." },
    { seq: 4, key: "backend", title: "خادم وواجهات API", agentRole: "backend", weightMin: 14, dependsOn: [2], instructions: "أنشئ src/server.js (http مدمج، بدون تبعيات): /api/health، و endpoint نموذجي حسب المشروع (حفظ/قائمة) بالتحقق من المدخلات. واكتب docs/API.md." },
    { seq: 5, key: "db", title: "تصميم قاعدة البيانات", agentRole: "database", weightMin: 8, dependsOn: [2], instructions: "اكتب docs/db-schema.sql بجداول النظام." },
    { seq: 6, key: "web-preview", title: "صفحة تعريفية (Web) للتطبيق", agentRole: "frontend", weightMin: 10, dependsOn: [2], instructions: "أنشئ public/index.html و public/styles.css: صفحة تعريفية عربية RTL للتطبيق (شاشات، مزايا، نموذج حجز/تواصل) تشير لـ app.js." },
    { seq: 7, key: "integration", title: "ربط الصفحة بالخادم", agentRole: "fullstack", weightMin: 8, dependsOn: [4, 6], instructions: "أنشئ public/app.js لربط نموذج الصفحة بـ /api/echo مع حالات تحميل وخطأ." },
    { seq: 8, key: "qa", title: "اختبار الخادم والواجهة", agentRole: "qa", weightMin: 10, dependsOn: [7], instructions: "شغّل الفحوصات الفعلية (صياغة JS، تشغيل خادم مؤقت) واكتب docs/test-report.md." },
    { seq: 9, key: "security", title: "فحص الأمان", agentRole: "security", weightMin: 8, dependsOn: [8], instructions: "افحص الملفات واكتب docs/security.md." },
    { seq: 10, key: "docs", title: "التوثيق", agentRole: "docs", weightMin: 8, dependsOn: [8], instructions: "اكتب README.md (تشغيل الخادم، خطوات بناء التطبيق لاحقاً) ودليل استخدام." },
    { seq: 11, key: "delivery", title: "تحضير التسليم", agentRole: "delivery", weightMin: 8, dependsOn: [9, 10], instructions: "اكتب DELIVERY.md مع تصريح صريح بما يحتاج بيئة بناء (Android/iOS) لدى العميل أو المطور البشري." },
  ];
}

function softwareTasks(): PlanTask[] {
  return [
    { seq: 1, key: "requirements", title: "متطلبات النظام", agentRole: "analyst", weightMin: 12, dependsOn: [], instructions: "اكتب docs/requirements.md: وحدات النظام، مستخدمون وصلاحيات، متطلبات مرقمة قابلة للاختبار." },
    { seq: 2, key: "architecture", title: "البنية التقنية", agentRole: "architect", weightMin: 10, dependsOn: [1], instructions: "اكتب docs/architecture.md: Node + PostgreSQL، مخطط الوحدات، أمان وصلاحيات." },
    { seq: 3, key: "db", title: "تصميم قاعدة البيانات", agentRole: "database", weightMin: 12, dependsOn: [2], instructions: "اكتب docs/db-schema.sql: جداول كاملة (مستخدمون/كائنات الأعمال/عمليات) بمفاتيح وفهارس." },
    { seq: 4, key: "backend", title: "الخادم وواجهات API", agentRole: "backend", weightMin: 16, dependsOn: [2, 3], instructions: "أنشئ src/server.js (http مدمج بدون تبعيات): /api/health + endpoints النظام مع تحقق مدخلات ورسائل خطأ آمنة، و docs/API.md." },
    { seq: 5, key: "frontend", title: "واجهة الإدارة", agentRole: "frontend", weightMin: 12, dependsOn: [2], instructions: "أنشئ public/index.html و public/styles.css: لوحة عربية RTL (ملخص + قائمة + نموذج) تشير لـ app.js." },
    { seq: 6, key: "integration", title: "ربط الواجهة بالخادم", agentRole: "fullstack", weightMin: 10, dependsOn: [4, 5], instructions: "أنشئ public/app.js: تحميل البيانات من الـ API، عرض، وأخطاء." },
    { seq: 7, key: "review", title: "مراجعة الكود", agentRole: "reviewer", weightMin: 8, dependsOn: [6], instructions: "اكتب docs/code-review.md بناءً على نتائج الفحوصات الفعلية." },
    { seq: 8, key: "qa", title: "اختبارات وظيفية", agentRole: "qa", weightMin: 12, dependsOn: [6, 7], instructions: "شغّل الفحوصات الفعلية وتشغيل خادم مؤقت، واكتب docs/test-report.md." },
    { seq: 9, key: "security", title: "فحص الصلاحيات والأمان", agentRole: "security", weightMin: 8, dependsOn: [8], instructions: "افحص المصادقة/الصلاحيات/الأسرار واكتب docs/security.md." },
    { seq: 10, key: "deploy", title: "خطة النشر", agentRole: "devops", weightMin: 8, dependsOn: [8], instructions: "أنشئ scripts/run.sh و docs/deploy.md." },
    { seq: 11, key: "cost", title: "تقدير التكلفة", agentRole: "cost", weightMin: 6, dependsOn: [8], instructions: "اكتب docs/cost-report.md؛ البيانات غير المتوفرة «غير متاح»." },
    { seq: 12, key: "delivery", title: "تحضير التسليم", agentRole: "delivery", weightMin: 8, dependsOn: [9, 10, 11], instructions: "اكتب DELIVERY.md كاملاً." },
  ];
}

function simpleTasks(kind: "docs" | "content" | "data" | "design" | "other"): PlanTask[] {
  if (kind === "data") {
    return [
      { seq: 1, key: "requirements", title: "نطاق التحليل", agentRole: "analyst", weightMin: 8, dependsOn: [], instructions: "اكتب docs/requirements.md: سؤال التحليل، البيانات المتوقعة، ومعلومات ناقصة." },
      { seq: 2, key: "dataset", title: "بيانات تجريبية منظمة", agentRole: "database", weightMin: 8, dependsOn: [1], instructions: "أنشئ data/sample.csv (20+ صف واقعي حسب الموضوع) و data/schema.md يصف الحقول." },
      { seq: 3, key: "analysis", title: "سكريبت تحليل فعلي", agentRole: "fullstack", weightMin: 12, dependsOn: [2], instructions: "أنشئ data/analysis.mjs (Node مدمج فقط): يقرأ CSV، يحسب مقاييس (جمع/متوسط/توزيع)، ويكتب data/report.json — قابل للتنفيذ بـ node." },
      { seq: 4, key: "qa", title: "اختبار سكريبت التحليل", agentRole: "qa", weightMin: 10, dependsOn: [3], instructions: "شغّل node --check على السكريبت، ووثق خطوات تشغيله ونتائجه في docs/test-report.md." },
      { seq: 5, key: "docs", title: "تقرير التحليل", agentRole: "docs", weightMin: 8, dependsOn: [4], instructions: "اكتب README.md بتعليمات التشغيل و docs/interpretation.md لكيفية قراءة النتائج." },
      { seq: 6, key: "delivery", title: "تحضير التسليم", agentRole: "delivery", weightMin: 6, dependsOn: [5], instructions: "اكتب DELIVERY.md بقائمة الملفات وما تم وما بقي." },
    ];
  }
  if (kind === "content") {
    return [
      { seq: 1, key: "requirements", title: "هوية وتوجه المحتوى", agentRole: "analyst", weightMin: 6, dependsOn: [], instructions: "اكتب docs/requirements.md: الجمهور (مصر/السعودية)، الرسالة، ونبرة الصوت." },
      { seq: 2, key: "strategy", title: "خطة المحتوى", agentRole: "pm", weightMin: 8, dependsOn: [1], instructions: "اكتب content/strategy.md: خطة أسبوعية (5 أيام × 3 منصات) بأهداف لكل منشور." },
      { seq: 3, key: "posts", title: "كتابة البوستات", agentRole: "docs", weightMin: 12, dependsOn: [2], instructions: "اكتب content/posts.md: 10 بوستات جاهزة (عنوان + نص + هاشتاجات) توزع على مصر والسعودية." },
      { seq: 4, key: "scripts", title: "سكريبتات فيديو", agentRole: "docs", weightMin: 10, dependsOn: [2], instructions: "اكتب content/tiktok-scripts.md: 5 سكريبتات (30 ث) بمشاهد وخطاف وخاتمة CTA." },
      { seq: 5, key: "qa", title: "مراجعة الجودة", agentRole: "reviewer", weightMin: 6, dependsOn: [3, 4], instructions: "راجع المحتوى (اتساق، بلا أسرار/روابط مزيفة) واكتب docs/review.md." },
      { seq: 6, key: "delivery", title: "تحضير التسليم", agentRole: "delivery", weightMin: 5, dependsOn: [5], instructions: "اكتب DELIVERY.md بقائمة الملفات." },
    ];
  }
  if (kind === "design") {
    return [
      { seq: 1, key: "requirements", title: "حالة التصميم", agentRole: "analyst", weightMin: 6, dependsOn: [], instructions: "اكتب docs/requirements.md: سياق المنتج، مستخدمون، وأهداف التصميم." },
      { seq: 2, key: "tokens", title: "نظام الألوان والخطوط", agentRole: "uiux", weightMin: 8, dependsOn: [1], instructions: "أنشئ design/tokens.css: متغيرات ألوان/خطوط/مسافات (متوافقة RTL) مع توثيق الاستخدام." },
      { seq: 3, key: "wireframes", title: "مخطط الشاشات", agentRole: "uiux", weightMin: 10, dependsOn: [1], instructions: "اكتب design/wireframes.md: مخطط نصي دقيق لـ 5 شاشات + تدفقات + إتاحة." },
      { seq: 4, key: "preview", title: "صفحة عرض للهوية", agentRole: "frontend", weightMin: 10, dependsOn: [2, 3], instructions: "أنشئ public/index.html و public/styles.css (تستورد tokens.css): صفحة عرض الهوية بألوان/خطوط/أنماط أزرار — RTL." },
      { seq: 5, key: "qa", title: "مراجعة الإتاحة", agentRole: "qa", weightMin: 6, dependsOn: [4], instructions: "افحص التباين و RTL واكتب docs/accessibility.md." },
      { seq: 6, key: "delivery", title: "تحضير التسليم", agentRole: "delivery", weightMin: 5, dependsOn: [5], instructions: "اكتب DELIVERY.md." },
    ];
  }
  // docs | other
  return [
    { seq: 1, key: "requirements", title: "نطاق المستندات", agentRole: "analyst", weightMin: 6, dependsOn: [], instructions: "اكتب docs/requirements.md: ما المطلوب توثيقه، الجمهور، ومستوى التفصيل." },
    { seq: 2, key: "main-doc", title: "المستند الرئيسي", agentRole: "docs", weightMin: 12, dependsOn: [1], instructions: "اكتب docs/main.md: المستند الكامل المطلوب (مهيكل بعناوين وأمثلة). أنشئ أيضاً README.md يوجّه للقراءة." },
    { seq: 3, key: "guide", title: "دليل التشغيل/الاستخدام", agentRole: "docs", weightMin: 8, dependsOn: [2], instructions: "اكتب docs/guide.md: خطوات عملية مرتبة بالعربية." },
    { seq: 4, key: "review", title: "مراجعة الجودة", agentRole: "reviewer", weightMin: 6, dependsOn: [3], instructions: "راجع الاتساق والدقة واكتب docs/review.md." },
    { seq: 5, key: "delivery", title: "تحضير التسليم", agentRole: "delivery", weightMin: 5, dependsOn: [4], instructions: "اكتب DELIVERY.md." },
  ];
}

function fallbackPlan(type: ServiceType, description: string): ProjectPlan {
  const tasks =
    type === "web"
      ? webTasks()
      : type === "app"
        ? appTasks()
        : type === "software"
          ? softwareTasks()
          : simpleTasks(type === "design" ? "design" : type === "data" ? "data" : type === "content" ? "content" : "docs");

  const total = tasks.reduce((s, t) => s + t.weightMin, 0);

  const missing: string[] = [];
  if (description.trim().length < 60) missing.push("وصف أوضح للميزات الأساسية (3 على الأقل)");
  if (type === "web" && !/دفع|فاتورة|checkout/i.test(description)) missing.push("بوابات الدفع المطلوبة (فودافون كاش/مدى/STC Pay)");
  if (type !== "docs" && type !== "content" && !/مصر|سعودي|مصري/i.test(description)) missing.push("السوق المستهدف: مصر أم السعودية أم الاثنان");

  return {
    feasibility:
      type === "app" ? "partial" : type === "other" ? "partial" : "supported",
    capabilityNote:
      type === "app"
        ? "بيئة بناء Android/iOS غير متاحة على الخادم — يُسلَّم: الخادم + الـ API + مواصفات التطبيق الكاملة وصفحة Web، ويُوثق ما يحتاج بناءً محلياً."
        : type === "other"
          ? "سيُنفَّذ ضمن قدرات الملفات النصية والفحوصات الآمنة المسموحة فقط؛ أي جزء يحتاج أدوات إضافية سيُوثق ويحال للمطور."
          : "قابل للتنفيذ الكامل ببيئة الملفات والفحوصات الآمنة المتاحة.",
    missingInfo: missing,
    scopeIn: ["التحليل والتخطيط", "بناء الملفات المطلوبة", "اختبارات فعلية (صياغة/تشغيل مؤقت/فحص أسرار)", "التوثيق الكامل", "تقرير تسليم"],
    scopeOut: ["النشر الفعلي على الإنتاج", "بوابات دفع حية بمفاتيح حقيقية", "تصميمات رسومية (صور) — مخرجات نصية وقالب CSS", "أي أمر طرفي خارج قائمة الفحوصات الآمنة"],
    assumptions: ["البيانات التجريبية تُستخدم حتى يوفر العميل بياناته", "بيئة Node.js متاحة على خادم التشغيل", "التواصل عبر البيانات المسجلة في الطلب"],
    tasks,
    estLowMin: Math.round(total * 0.8),
    estHighMin: Math.round(total * 1.6),
    costNote: "التكلفة النهائية تُحسب بعد الاعتماد بناءً على حجم المهام والوقت الفعلي واستهلاك النماذج المسجل — لا أرقام تقديرية وهمية.",
    source: "local",
  };
}

// ------------------------------------------------------------
// تحليل بالنموذج (JSON صارم) ثم تحقق من الشكل قبل القبول
// ------------------------------------------------------------

function sanitizePlan(raw: unknown): ProjectPlan | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const tasks = Array.isArray(o.tasks) ? (o.tasks as Record<string, unknown>[]) : [];
  const clean: PlanTask[] = [];
  for (let i = 0; i < Math.min(tasks.length, 20); i++) {
    const t = tasks[i];
    const title = typeof t?.title === "string" ? t.title.slice(0, 200) : "";
    const agentRole = typeof t?.agentRole === "string" ? t.agentRole.slice(0, 30) : "";
    if (!title || !agentRole) return null;
    clean.push({
      seq: i + 1,
      key: typeof t.key === "string" ? t.key.slice(0, 40) : `task-${i + 1}`,
      title,
      agentRole,
      weightMin: Math.max(4, Math.min(30, Number(t.weightMin) || 10)),
      dependsOn: Array.isArray(t.dependsOn) ? (t.dependsOn as unknown[]).map(Number).filter((n) => n > 0 && n <= i) : [],
      instructions: typeof t.instructions === "string" ? t.instructions.slice(0, 600) : "",
    });
  }
  if (clean.length < 3 || clean.length > 16) return null;
  const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");
  const arr = (v: unknown) => (Array.isArray(v) ? v.map((x) => str(x, 200)).filter(Boolean) : []);
  const total = clean.reduce((s, t) => s + t.weightMin, 0);
  return {
    feasibility: o.feasibility === "partial" || o.feasibility === "not_supported" ? (o.feasibility as "partial" | "not_supported") : "supported",
    capabilityNote: str(o.capabilityNote, 400) || "قابل للتنفيذ ضمن القدرات المتاحة.",
    missingInfo: arr(o.missingInfo).slice(0, 6),
    scopeIn: arr(o.scopeIn).slice(0, 8),
    scopeOut: arr(o.scopeOut).slice(0, 8),
    assumptions: arr(o.assumptions).slice(0, 6),
    tasks: clean,
    estLowMin: Math.max(10, Math.min(total * 2, Number(o.estLowMin) || total)),
    estHighMin: Math.max(10, Math.min(total * 3, Number(o.estHighMin) || Math.round(total * 1.6))),
    costNote: str(o.costNote, 300) || "تُحسب بعد الاعتماد من البيانات الفعلية.",
    source: "model",
  };
}

export async function planProject(input: {
  title: string;
  description: string;
  serviceType: ServiceType;
}): Promise<ProjectPlan> {
  const { title, description, serviceType } = input;
  const ai = await askModel({
    timeoutMs: 60_000,
    system: `أنت العقل المركزي لشركة NEBRAS AI. تحلل طلب عميل وتخرجه خطة مهام JSON صالح فقط بدون أي نص خارجه.
النوع المطلوب: ${TYPE_LABEL[serviceType]}.
${CAPABILITIES}
مهام JSON:
{"feasibility":"supported|partial|not_supported","capabilityNote":"string","missingInfo":["string"],"scopeIn":["string"],"scopeOut":["string"],"assumptions":["string"],"tasks":[{"seq":1,"key":"slug","title":"string","agentRole":"pm|analyst|architect|frontend|backend|fullstack|mobile|database|devops|uiux|qa|reviewer|security|support|docs|delivery|cost|ops","weightMin":4-30,"dependsOn":[],"instructions":"string"}],"estLowMin":number,"estHighMin":number,"costNote":"string"}
مستلزمات: 4-14 مهمة مترابطة، تبدأ بالمتطلبات (analyst) وتنتهي بالتسليم (delivery)، ولا موظف من غير الفريق المناسب للمشروع.`,
    user: `الطلب:
العنوان: ${title}
الوصف: ${description}
${description.trim().length < 60 ? "ملاحظة: الوصف موجز — حدد المعلومات الناقصة المطلوب سؤال العميل عنها." : ""}`,
  });

  if (ai) {
    try {
      const jsonStart = ai.text.indexOf("{");
      const jsonEnd = ai.text.lastIndexOf("}");
      if (jsonStart >= 0 && jsonEnd > jsonStart) {
        const parsed = JSON.parse(ai.text.slice(jsonStart, jsonEnd + 1));
        const plan = sanitizePlan(parsed);
        if (plan) return postProcessPlan(plan, serviceType);
      }
    } catch {
      // نقع للمخطط المحلي
    }
  }
  const base = fallbackPlan(serviceType, description);
  return postProcessPlan(base, serviceType);
}

/** معايرة التوقع من السجل التاريخي + حقن الدروس المكتسبة */
async function postProcessPlan(plan: ProjectPlan, serviceType: string): Promise<ProjectPlan> {
  const cal = await calibrateEstimate(serviceType, plan.estLowMin, plan.estHighMin);
  const out: ProjectPlan = {
    ...plan,
    estLowMin: cal.estLow,
    estHighMin: Math.max(cal.estLow + 5, cal.estHigh),
    assumptions: [...plan.assumptions, cal.note],
  };
  if (cal.sample >= 3) {
    const lessons = await relevantLessons(serviceType);
    if (lessons.length) {
      out.assumptions = [
        ...out.assumptions,
        `دروس من ${cal.sample} مشاريع سابقة من نفس النوع: ${lessons.join("؛ ").slice(0, 300)}`,
      ];
    }
  }
  return out;
}

export function typeLabel(t: ServiceType): string {
  return TYPE_LABEL[t] ?? t;
}
