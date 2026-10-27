"use client";

/**
 * مديرات الموارد في لوحة الإدارة.
 *
 * لماذا هذا الملف؟ تعريفات الأعمدة تحتوي دوال `render`، ودوال لا يمكن تمريرها من
 * مكوّن خادم إلى مكوّن عميل (خطأ "Functions cannot be passed directly to Client
 * Components"). لذلك تُعرَّف كل الإعدادات هنا داخل مكونات عميل، وتستقبل الصفحات
 * الخادمة قوائم الخيارات (مراحل/مواد/معلمون) كبيانات نصية فقط.
 */

import { ResourceManager, StatusBadge, type ColumnDef, type FieldDef } from "@/components/admin/resource-manager";
import { Badge } from "@/components/ui";
import { CountryFlag } from "@/components/country-flag";
import { IconLamp } from "@/components/icons";
import { COUNTRY_LIST, getCountry } from "@/lib/countries";
import { LEVEL_LABEL, ROLE_LABEL, STATUS_LABEL, formatDate, formatDateTime, relativeTime } from "@/lib/utils";

export type Option = { value: string; label: string };

const ROLE_MAP: Record<string, { label: string; tone: "navy" | "gold" | "muted" }> = {
  admin: { label: "مدير", tone: "gold" },
  teacher: { label: "معلم", tone: "navy" },
  student: { label: "طالب", tone: "muted" },
};

const PUBLISH_MAP = {
  published: { label: "منشور", tone: "success" },
  draft: { label: "مسودة", tone: "warning" },
  archived: { label: "مؤرشف", tone: "muted" },
} as const;

const MSG_STATUS = {
  new: { label: "جديد", tone: "gold" },
  read: { label: "مقروء", tone: "navy" },
  replied: { label: "تم الرد", tone: "success" },
} as const;

/* -------------------------------- المستخدمون -------------------------------- */

export function UsersManager({ stageOptions }: { stageOptions: Option[] }) {
  const fields: FieldDef[] = [
    { name: "fullName", label: "الاسم الكامل", type: "text", required: true, placeholder: "الاسم الثلاثي" },
    { name: "email", label: "البريد الإلكتروني", type: "email", required: true, placeholder: "name@example.com" },
    { name: "password", label: "كلمة المرور", type: "password", createOnly: true, hint: "٨ خانات على الأقل — عند التعديل اتركه فارغًا لعدم التغيير", placeholder: "••••••••" },
    { name: "role", label: "الصلاحية", type: "select", options: Object.entries(ROLE_LABEL).map(([value, label]) => ({ value, label })), defaultValue: "student" },
    { name: "status", label: "حالة الحساب", type: "select", options: [{ value: "active", label: "نشط" }, { value: "suspended", label: "موقوف" }], defaultValue: "active" },
    { name: "country", label: "الدولة (مدعومة فقط)", type: "select", required: true, options: COUNTRY_LIST.map((c) => ({ value: c.code, label: `${c.nameAr} — ${c.dial}` })), defaultValue: "EG", hint: "المنصة محصورة في: مصر، السعودية، الأردن، الإمارات" },
    { name: "stageId", label: "المرحلة الدراسية", type: "select", options: stageOptions },
    { name: "phone", label: "رقم الجوال", type: "text", placeholder: "+20 10 1234 5678" },
    { name: "city", label: "المدينة", type: "text" },
    { name: "bio", label: "نبذة", type: "textarea" },
    { name: "isActive", label: "الحساب مفعّل", type: "boolean", defaultValue: true, hint: "إلغاء التفعيل يمنع تسجيل الدخول فورًا" },
  ];

  const columns: ColumnDef[] = [
    {
      key: "fullName",
      label: "المستخدم",
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate font-bold text-navy-800">{String(row.fullName)}</p>
          <p className="truncate text-xs font-semibold text-mist-500" dir="ltr">{String(row.email)}</p>
        </div>
      ),
    },
    { key: "role", label: "الصلاحية", render: (row) => <StatusBadge value={row.role} map={ROLE_MAP} /> },
    {
      key: "status",
      label: "الحالة",
      render: (row) => (
        <span className="flex flex-wrap gap-1.5">
          <Badge tone={row.status === "active" ? "success" : "danger"}>{row.status === "active" ? "نشط" : "موقوف"}</Badge>
          {!row.isActive && <Badge tone="warning">معطّل</Badge>}
        </span>
      ),
    },
    {
      key: "country",
      label: "الدولة",
      render: (row) => (
        <span className="inline-flex items-center gap-2">
          <CountryFlag code={String(row.country ?? "")} className="h-3.5 w-5" />
          <span className="text-xs font-bold text-navy-800">{row.country ? getCountry(String(row.country)).nameAr : "غير محددة"}</span>
        </span>
      ),
    },
    { key: "stageName", label: "المرحلة", hideOnMobile: true, render: (row) => String(row.stageName ?? "—") },
    { key: "lastLoginAt", label: "آخر دخول", hideOnMobile: true, render: (row) => (row.lastLoginAt ? relativeTime(String(row.lastLoginAt)) : "لم يسجل دخول") },
    { key: "createdAt", label: "تاريخ الانضمام", hideOnMobile: true, render: (row) => formatDateTime(String(row.createdAt)) },
  ];

  return (
    <ResourceManager
      entity="users"
      title="إدارة المستخدمين"
      description="إنشاء الحسابات، منح الصلاحيات (طالب / معلم / مدير)، إيقاف الحسابات، وإعادة تعيين كلمات المرور."
      createLabel="إضافة مستخدم"
      fields={fields}
      columns={columns}
      pageSize={12}
      filters={[
        { name: "role", label: "كل الصلاحيات", options: Object.entries(ROLE_LABEL).map(([value, label]) => ({ value, label })) },
        { name: "status", label: "كل الحالات", options: [{ value: "active", label: "نشط" }, { value: "suspended", label: "موقوف" }] },
        { name: "country", label: "كل الدول", options: COUNTRY_LIST.map((c) => ({ value: c.code, label: c.nameAr })) },
      ]}
      emptyHint="لا مستخدمين مطابقين — جرّب مسح البحث أو أضف مستخدمًا جديدًا."
    />
  );
}

/* --------------------------------- الكورسات --------------------------------- */

export function CoursesManager({
  stageOptions, subjectOptions, teacherOptions,
}: { stageOptions: Option[]; subjectOptions: Option[]; teacherOptions: Option[] }) {
  const fields: FieldDef[] = [
    { name: "title", label: "عنوان الكورس", type: "text", required: true, placeholder: "مثال: الفيزياء — الحركة والقوى" },
    { name: "stageId", label: "المرحلة التعليمية", type: "select", required: true, options: stageOptions },
    { name: "subjectId", label: "المادة", type: "select", options: subjectOptions },
    { name: "teacherId", label: "المعلم المسؤول", type: "select", options: teacherOptions },
    { name: "level", label: "المستوى", type: "select", options: Object.entries(LEVEL_LABEL).map(([value, label]) => ({ value, label })), defaultValue: "beginner" },
    { name: "status", label: "حالة النشر", type: "select", options: Object.entries(STATUS_LABEL).filter(([k]) => ["draft", "published", "archived"].includes(k)).map(([value, label]) => ({ value, label })), defaultValue: "published" },
    { name: "durationMinutes", label: "المدة الإجمالية (دقيقة)", type: "number", defaultValue: 0 },
    { name: "price", label: "السعر (٠ = مجاني)", type: "number", defaultValue: 0 },
    { name: "summary", label: "ملخص قصير", type: "textarea", placeholder: "جملة أو جملتان تظهران في بطاقة الكورس" },
    { name: "description", label: "الوصف الكامل", type: "richtext", placeholder: "اكتب وصفًا تفصيليًا… يمكنك استخدام وسوم HTML بسيطة مثل <p> و<strong>" },
    { name: "learningOutcomes", label: "مخرجات التعلّم", type: "tags", placeholder: "ماذا سيتقن الطالب؟", hint: "سطر لكل مخرَج تعليمي" },
    { name: "requirements", label: "المتطلبات", type: "tags", placeholder: "متطلب سابق", hint: "سطر لكل متطلب" },
    { name: "coverUrl", label: "رابط صورة الغلاف", type: "text", hint: "اختياري — إن تُرك فارغًا يُولَّد غلاف هندسي تلقائيًا" },
    { name: "isFeatured", label: "كورس مميّز", type: "boolean", hint: "يظهر في القسم المميّز بالصفحة الرئيسية" },
    { name: "isFree", label: "التسجيل مجاني", type: "boolean", defaultValue: true },
  ];

  const columns: ColumnDef[] = [
    {
      key: "title",
      label: "الكورس",
      render: (row) => (
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-bold text-navy-800">
            <span className="truncate">{String(row.title)}</span>
            {Boolean(row.isFeatured) && <Badge tone="gold">مميّز</Badge>}
          </p>
          <p className="mt-0.5 truncate text-xs font-semibold text-mist-500">
            {String(row.stageName ?? "—")}{row.subjectName ? ` · ${String(row.subjectName)}` : ""}
          </p>
        </div>
      ),
    },
    { key: "level", label: "المستوى", render: (row) => <Badge tone="navy">{LEVEL_LABEL[String(row.level)] ?? String(row.level)}</Badge> },
    { key: "status", label: "الحالة", render: (row) => <StatusBadge value={row.status} map={PUBLISH_MAP} /> },
    { key: "teacherName", label: "المعلم", hideOnMobile: true, render: (row) => String(row.teacherName ?? "—") },
    { key: "durationMinutes", label: "المدة", hideOnMobile: true, render: (row) => formatDurationSafe(Number(row.durationMinutes ?? 0)) },
    { key: "createdAt", label: "أُضيف في", hideOnMobile: true, render: (row) => formatDate(String(row.createdAt)) },
  ];

  return (
    <ResourceManager
      entity="courses"
      title="إدارة الكورسات"
      description="أنشئ الكورسات وعدّلها وانشرها، ثم ادخل إلى الكورس لإدارة دروسه واختباراته وأسئلته."
      createLabel="كورس جديد"
      fields={fields}
      columns={columns}
      pageSize={10}
      rowLink={(row) => `/admin/courses/${String(row.id)}`}
      filters={[
        { name: "stageId", label: "كل المراحل", options: stageOptions },
        { name: "status", label: "كل الحالات", options: [{ value: "published", label: "منشور" }, { value: "draft", label: "مسودة" }, { value: "archived", label: "مؤرشف" }] },
      ]}
      emptyHint="لا كورسات مطابقة — أنشئ كورسًا جديدًا أو غيّر عوامل التصفية."
    />
  );
}

function formatDurationSafe(minutes: number): string {
  if (!minutes || minutes <= 0) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} دقيقة`;
  if (m === 0) return `${h} ساعة`;
  return `${h} س ${m} د`;
}

/* ------------------------------ المراحل والمواد ------------------------------ */

const ICON_OPTIONS = [
  { value: "seedling", label: "نبتة (ابتدائي)" },
  { value: "compass", label: "بوصلة (إعدادي)" },
  { value: "flask", label: "قارورة (علوم)" },
  { value: "graduation", label: "قبعة تخرّج (جامعي)" },
  { value: "spark", label: "شرارة (مهارات)" },
  { value: "book", label: "كتاب" },
  { value: "layers", label: "طبقات" },
];

export function StagesManager() {
  const fields: FieldDef[] = [
    { name: "name", label: "اسم المرحلة (عربي)", type: "text", required: true, placeholder: "المرحلة الثانوية" },
    { name: "nameEn", label: "الاسم بالإنجليزية", type: "text", required: true, placeholder: "High School" },
    { name: "iconKey", label: "الأيقونة", type: "select", options: ICON_OPTIONS, defaultValue: "book" },
    { name: "accent", label: "لون المرحلة", type: "color", defaultValue: "#1B3A6B", hint: "يُستخدم في البطاقات والأغلفة" },
    { name: "sortOrder", label: "ترتيب العرض", type: "number", defaultValue: 0 },
    { name: "description", label: "الوصف", type: "textarea" },
    { name: "isActive", label: "مرحلة مفعّلة", type: "boolean", defaultValue: true },
  ];

  const columns: ColumnDef[] = [
    {
      key: "name",
      label: "المرحلة",
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <span className="h-6 w-6 shrink-0 rounded-md ring-1 ring-mist-200" style={{ background: String(row.accent ?? "#1B3A6B") }} />
          <div className="min-w-0">
            <p className="truncate font-bold text-navy-800">{String(row.name)}</p>
            <p className="truncate text-xs font-semibold text-mist-500" dir="ltr">{String(row.nameEn)}</p>
          </div>
        </div>
      ),
    },
    { key: "iconKey", label: "الأيقونة", hideOnMobile: true, render: (row) => <Badge tone="muted">{ICON_OPTIONS.find((o) => o.value === row.iconKey)?.label ?? String(row.iconKey)}</Badge> },
    { key: "sortOrder", label: "الترتيب", hideOnMobile: true },
    { key: "isActive", label: "الحالة", render: (row) => <Badge tone={row.isActive ? "success" : "muted"}>{row.isActive ? "مفعّلة" : "مخفية"}</Badge> },
  ];

  return (
    <ResourceManager
      entity="stages"
      title="المراحل التعليمية"
      description="ترتيب العرض يتحكم في تسلسل المراحل على الصفحة الرئيسية وصفحة المراحل."
      createLabel="مرحلة جديدة"
      fields={fields}
      columns={columns}
      pageSize={10}
    />
  );
}

export function SubjectsManager({ stageOptions }: { stageOptions: Option[] }) {
  const fields: FieldDef[] = [
    { name: "stageId", label: "المرحلة", type: "select", required: true, options: stageOptions },
    { name: "name", label: "اسم المادة", type: "text", required: true, placeholder: "الرياضيات" },
    { name: "accent", label: "لون المادة", type: "color", defaultValue: "#C9A227" },
    { name: "sortOrder", label: "ترتيب العرض", type: "number", defaultValue: 0 },
    { name: "description", label: "الوصف", type: "textarea" },
    { name: "isActive", label: "مادة مفعّلة", type: "boolean", defaultValue: true },
  ];

  const columns: ColumnDef[] = [
    {
      key: "name",
      label: "المادة",
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <span className="h-6 w-6 shrink-0 rounded-md ring-1 ring-mist-200" style={{ background: String(row.accent ?? "#C9A227") }} />
          <p className="truncate font-bold text-navy-800">{String(row.name)}</p>
        </div>
      ),
    },
    { key: "stageName", label: "المرحلة", render: (row) => <Badge tone="navy">{String(row.stageName ?? "—")}</Badge> },
    { key: "sortOrder", label: "الترتيب", hideOnMobile: true },
    { key: "isActive", label: "الحالة", render: (row) => <Badge tone={row.isActive ? "success" : "muted"}>{row.isActive ? "مفعّلة" : "مخفية"}</Badge> },
  ];

  return (
    <ResourceManager
      entity="subjects"
      title="المواد الدراسية"
      description="كل مادة تنتمي لمرحلة واحدة، ويمكن ربط الكورسات بها لتسهيل التصفية."
      createLabel="مادة جديدة"
      fields={fields}
      columns={columns}
      pageSize={10}
      filters={[{ name: "stageId", label: "كل المراحل", options: stageOptions }]}
    />
  );
}

/* ------------------------------- التسجيلات ------------------------------- */

export function EnrollmentsManager() {
  const fields: FieldDef[] = [
    { name: "status", label: "حالة التسجيل", type: "select", options: [{ value: "in_progress", label: "قيد التقدّم" }, { value: "completed", label: "مكتمل" }, { value: "dropped", label: "منسحب" }] },
    { name: "progressPercent", label: "نسبة الإنجاز (٠-١٠٠)", type: "number", defaultValue: 0 },
  ];

  const columns: ColumnDef[] = [
    { key: "userName", label: "الطالب", render: (row) => <span className="font-bold text-navy-800">{String(row.userName ?? "—")}</span> },
    { key: "userEmail", label: "البريد", hideOnMobile: true, render: (row) => <span dir="ltr" className="text-xs font-semibold text-mist-500">{String(row.userEmail ?? "—")}</span> },
    { key: "courseTitle", label: "الكورس", render: (row) => String(row.courseTitle ?? "—") },
    {
      key: "progressPercent",
      label: "الإنجاز",
      render: (row) => (
        <span className="inline-flex items-center gap-2">
          <span className="h-1.5 w-16 overflow-hidden rounded-full bg-mist-200">
            <span className="block h-full rounded-full bg-navy-600" style={{ width: `${Number(row.progressPercent ?? 0)}%` }} />
          </span>
          <b className="tabular-nums text-xs">{Number(row.progressPercent ?? 0)}٪</b>
        </span>
      ),
    },
    { key: "status", label: "الحالة", render: (row) => <Badge tone={row.status === "completed" ? "success" : row.status === "dropped" ? "danger" : "navy"}>{row.status === "completed" ? "مكتمل" : row.status === "dropped" ? "منسحب" : "قيد التقدّم"}</Badge> },
    { key: "enrolledAt", label: "تاريخ التسجيل", hideOnMobile: true, render: (row) => relativeTime(String(row.enrolledAt)) },
  ];

  return (
    <ResourceManager
      entity="enrollments"
      title="تسجيلات الطلاب في الكورسات"
      description="يمكنك تعديل نسبة الإنجاز أو حالة التسجيل يدويًا عند الحاجة."
      createLabel="تسجيل يدوي"
      fields={fields}
      columns={columns}
      pageSize={10}
      filters={[{ name: "status", label: "كل الحالات", options: [{ value: "in_progress", label: "قيد التقدّم" }, { value: "completed", label: "مكتمل" }, { value: "dropped", label: "منسحب" }] }]}
    />
  );
}

/* --------------------------- الرسائل والإعلانات --------------------------- */

export function BroadcastsManager() {
  const fields: FieldDef[] = [
    { name: "message", label: "نص الرسالة", type: "textarea", required: true, hint: "٢٨٠ حرفًا كحد أقصى" },
    { name: "tone", label: "اللون", type: "select", options: [{ value: "gold", label: "ذهبي" }, { value: "info", label: "أزرق" }, { value: "success", label: "أخضر" }, { value: "urgent", label: "أحمر عاجل" }], defaultValue: "gold" },
    { name: "durationSeconds", label: "مدة الظهور (ثانية)", type: "number", defaultValue: 10 },
    { name: "activeForMinutes", label: "نافذة التسليم (دقيقة)", type: "number", defaultValue: 15, createOnly: true },
    { name: "isActive", label: "بثّ حيّ", type: "boolean", defaultValue: true },
  ];

  const columns: ColumnDef[] = [
    {
      key: "message",
      label: "الرسالة",
      render: (row) => (
        <div className="min-w-0 max-w-md">
          <p className="flex items-center gap-2 font-bold text-navy-800">
            <IconLamp className="h-4 w-4 shrink-0 text-gold-600" />
            <span className="truncate">{String(row.message)}</span>
          </p>
          <p className="mt-0.5 text-xs font-semibold text-mist-500">بواسطة {String(row.createdByName ?? "—")}</p>
        </div>
      ),
    },
    { key: "durationSeconds", label: "المدة", render: (row) => <Badge tone="navy">{String(row.durationSeconds)} ثانية</Badge> },
    { key: "views", label: "المشاهدات", render: (row) => <b className="tabular-nums text-navy-800">{String(row.views ?? 0)}</b> },
    { key: "isActive", label: "الحالة", render: (row) => <Badge tone={row.isActive ? "success" : "muted"}>{row.isActive ? "حيّ" : "منتهي"}</Badge> },
    { key: "createdAt", label: "أُرسل في", hideOnMobile: true, render: (row) => relativeTime(String(row.createdAt)) },
  ];

  return (
    <ResourceManager
      entity="broadcasts"
      title="سجلّ البثّات الفورية"
      description="كل رسالة بُثّت للمستخدمين مع مدة الظهور وعدد المشاهدات وحالة البثّ."
      createLabel="بثّ جديد"
      fields={fields}
      columns={columns}
      pageSize={8}
    />
  );
}

export function AnnouncementsManager({ stageOptions }: { stageOptions: Option[] }) {
  const fields: FieldDef[] = [
    { name: "title", label: "عنوان الإعلان", type: "text", required: true },
    { name: "body", label: "نص الإعلان", type: "richtext", required: true },
    { name: "audience", label: "الجمهور", type: "select", options: [{ value: "all", label: "الجميع" }, { value: "students", label: "الطلاب" }, { value: "teachers", label: "المعلمون" }], defaultValue: "all" },
    { name: "stageId", label: "مرحلة محدّدة (اختياري)", type: "select", options: stageOptions },
    { name: "isPublished", label: "منشور", type: "boolean", defaultValue: true },
  ];

  const columns: ColumnDef[] = [
    {
      key: "title",
      label: "الإعلان",
      render: (row) => (
        <div className="min-w-0 max-w-md">
          <p className="truncate font-bold text-navy-800">{String(row.title)}</p>
          <p className="mt-0.5 line-clamp-2 text-xs leading-6 text-mist-600">{String(row.body)}</p>
        </div>
      ),
    },
    { key: "audience", label: "الجمهور", render: (row) => <Badge tone="navy">{row.audience === "all" ? "الجميع" : row.audience === "students" ? "الطلاب" : "المعلمون"}</Badge> },
    { key: "isPublished", label: "الحالة", render: (row) => <Badge tone={row.isPublished ? "success" : "muted"}>{row.isPublished ? "منشور" : "مسودة"}</Badge> },
    { key: "publishedAt", label: "تاريخ النشر", hideOnMobile: true, render: (row) => formatDateTime(String(row.publishedAt)) },
  ];

  return (
    <ResourceManager
      entity="announcements"
      title="إعلانات المنصة"
      description="تظهر الإعلانات المنشورة في الصفحة الرئيسية ولوحة الطالب."
      createLabel="إعلان جديد"
      fields={fields}
      columns={columns}
      pageSize={8}
    />
  );
}

export function MessagesManager() {
  const fields: FieldDef[] = [
    { name: "name", label: "اسم المرسل", type: "text", required: true },
    { name: "email", label: "البريد الإلكتروني", type: "email", required: true },
    { name: "subject", label: "الموضوع", type: "text", required: true },
    { name: "message", label: "نص الرسالة", type: "richtext", required: true },
    { name: "country", label: "الدولة", type: "select", options: COUNTRY_LIST.map((c) => ({ value: c.code, label: c.nameAr })) },
    { name: "status", label: "حالة المعالجة", type: "select", options: [{ value: "new", label: "جديد" }, { value: "read", label: "مقروء" }, { value: "replied", label: "تم الرد" }], defaultValue: "new" },
  ];

  const columns: ColumnDef[] = [
    {
      key: "subject",
      label: "الرسالة",
      render: (row) => (
        <div className="min-w-0 max-w-md">
          <p className="truncate font-bold text-navy-800">{String(row.subject)}</p>
          <p className="truncate text-xs font-semibold text-mist-500">{String(row.name)} · <span dir="ltr">{String(row.email)}</span></p>
          <p className="mt-1 line-clamp-2 text-xs leading-6 text-mist-600">{String(row.message)}</p>
        </div>
      ),
    },
    {
      key: "country",
      label: "الدولة",
      hideOnMobile: true,
      render: (row) => (
        <span className="inline-flex items-center gap-1.5">
          <CountryFlag code={String(row.country ?? "")} className="h-3.5 w-5" />
          <span className="text-xs font-bold">{row.country ? getCountry(String(row.country)).nameAr : "—"}</span>
        </span>
      ),
    },
    { key: "status", label: "الحالة", render: (row) => <StatusBadge value={row.status} map={MSG_STATUS} /> },
    { key: "createdAt", label: "الاستلام", hideOnMobile: true, render: (row) => relativeTime(String(row.createdAt)) },
  ];

  return (
    <ResourceManager
      entity="contactMessages"
      title="رسائل التواصل الواردة"
      description="حدّث حالة كل رسالة (جديد ← مقروء ← تم الرد) لمتابعة بلاغات المستخدمين."
      createLabel="إضافة رسالة يدويًا"
      fields={fields}
      columns={columns}
      pageSize={8}
      filters={[
        { name: "status", label: "كل الحالات", options: [{ value: "new", label: "جديد" }, { value: "read", label: "مقروء" }, { value: "replied", label: "تم الرد" }] },
        { name: "country", label: "كل الدول", options: COUNTRY_LIST.map((c) => ({ value: c.code, label: c.nameAr })) },
      ]}
    />
  );
}
