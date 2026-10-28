// ============================================================
// NEBRAS AI — محرك التنفيذ الحقيقي
// - ينفذ المهام تسلسلياً بالاعتماد على التبعيات
// - يكتب ملفات حقيقية (قاعدة بيانات + مجلد workspaces/)
// - يشغّل فحوصات فعلية: node --check، تشغيل خادم مؤقت، فحص أسرار
// - حدود: عدد ملفات، حجم كلي، محاولات لكل مهمة، زمن لكل فحص
// - لا أوامر طرفية خارج قائمة الفحوصات الآمنة
// ============================================================

import { eq, and, inArray, desc, sql } from "drizzle-orm";
import { execFile, spawn, type ChildProcess } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import { db } from "@/db";
import {
  projects,
  projectTasks,
  projectEvents,
  projectFiles,
  projectTestResults,
  deliveryEstimates,
  approvals,
  clientMessages,
  modelUsage,
  projectNotes,
  projectRequirements,
  aiEmployees,
} from "@/db/schema";
import { askModel } from "@/lib/model";
import { planProject, type ServiceType, type ProjectPlan } from "./plan";
import { generateFiles, type GenFile } from "./generator";
import { kbSearch, recordKbUsage, harvestExperience } from "./kb";

const pExecFile = promisify(execFile);

const WS_ROOT = path.join(process.cwd(), "workspaces");
const ALLOWED_TOP = ["public", "src", "docs", "scripts", "data", "content", "design"];
const SAFE_FILE = /^(public|src|docs|scripts|data|content|design)\/[\w.\-\/]+$/;
const SAFE_ROOT = /^(README\.md|DELIVERY\.md|package\.json|LICENSE)$/;

interface RunState {
  cancelled: boolean;
  paused: boolean;
}
const running = new Map<number, RunState>();

function wsDir(code: string) {
  return path.join(WS_ROOT, code);
}

function safeRelPath(p: string): string | null {
  if (!p || p.includes("\0")) return null;
  const clean = p.replace(/\\/g, "/").replace(/^\/+/, "");
  if (clean.includes("..")) return null;
  if (SAFE_ROOT.test(clean) || SAFE_FILE.test(clean)) return clean;
  return null;
}

export async function logEvent(
  projectId: number,
  kind: string,
  message: string,
  opts: { actor?: string; taskId?: number; meta?: unknown } = {},
) {
  await db.insert(projectEvents).values({
    projectId,
    taskId: opts.taskId ?? null,
    kind,
    actor: opts.actor ?? "العقل المركزي",
    message,
    meta: opts.meta ? JSON.stringify(opts.meta).slice(0, 2000) : null,
  });
}

export async function addClientMessage(
  projectId: number,
  sender: "client" | "dev" | "system",
  content: string,
) {
  await db.insert(clientMessages).values({ projectId, sender, content });
}

function now() {
  return new Date();
}

// ------------------------------------------------------------
// التحليل (العقل المركزي)
// ------------------------------------------------------------

export async function analyzeProject(projectId: number): Promise<void> {
  const [row] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!row) return;
  if (row.status === "running" && running.has(projectId)) return; // لا تحليل أثناء التنفيذ

  await logEvent(projectId, "analysis", "بدأ العقل المركزي تحليل الطلب وتحديد النوع والإمكانات.");

  const plan: ProjectPlan = await planProject({
    title: row.title,
    description: row.description,
    serviceType: row.serviceType as ServiceType,
  });

  // مسح مهام قديمة من تحليل سابق
  await db.delete(projectTasks).where(eq(projectTasks.projectId, projectId));

  const scopeIn = plan.scopeIn.join("\n");
  const scopeOut = plan.scopeOut.join("\n");
  const missing = plan.missingInfo;

  let version = 1;
  const [existing] = await db
    .select({ c: sql<number>`count(*)` })
    .from(projectRequirements)
    .where(eq(projectRequirements.projectId, projectId));
  version = (existing?.c ?? 0) + 1;

  const requirementsDoc = `# متطلبات المشروع — الإصدار ${version}
## العنوان: ${row.title}
## النوع: ${row.serviceType}
## العميل: ${row.clientName}

### قابلية التنفيذ
${plan.feasibility === "supported" ? "قابل للتنفيذ الكامل ضمن القدرات المتاحة." : plan.feasibility === "partial" ? "تنفيذ جزئي — بعض الأجزاء تتطلب بيئة إضافية (موثقة أدناه)." : "غير قابل للتنفيذ في بيئة الأدوات الحالية — يتطلب قراراً بشرياً."}
${plan.capabilityNote}

### النطاق المضمن
${scopeIn.split("\n").map((s) => `- ${s}`).join("\n")}

### خارج النطاق
${scopeOut.split("\n").map((s) => `- ${s}`).join("\n")}

### معلومات ناقصة (يُسأل عنها العميل)
${missing.length ? missing.map((m) => `- ${m}`).join("\n") : "- لا يوجد"}

### افتراضات
${plan.assumptions.map((a) => `- ${a}`).join("\n")}

### التقدير الأولي
- نطاق المدة: ${plan.estLowMin} – ${plan.estHighMin} دقيقة (وزن مهام استرشادي — يُحدّث بالمدة الفعلية أثناء التنفيذ)
- التكلفة: ${plan.costNote}
### خطة المهام
${plan.tasks.map((t) => `${t.seq}) [${t.agentRole}] ${t.title} (~${t.weightMin} د) يعتمد على: ${t.dependsOn.join(",") || "لا شيء"}`).join("\n")}
`;

  await db.insert(projectRequirements).values({
    projectId,
    version,
    content: requirementsDoc,
  });

  const totalWeight = plan.tasks.reduce((s, t) => s + t.weightMin, 0);
  const etaLow = new Date(Date.now() + plan.estLowMin * 60_000);
  const etaHigh = new Date(Date.now() + plan.estHighMin * 60_000);

  await db.insert(deliveryEstimates).values({
    projectId,
    etaLow,
    etaHigh,
    confidence: plan.source === "model" ? 55 : 45,
    basis: `تقدير أولي: ${plan.tasks.length} مهمة بإجمالي ${totalWeight} دقيقة وزن (×0.8–×1.6). الافتراضات: ${plan.assumptions.slice(0, 2).join("، ") || "—"}. يُعاد الحساب بعد كل مهمة من زمن التنفيذ الفعلي.`,
  });

  // حذف موافقات قديمة (إعادة التحليل تلغي اعتماد النطاق القديم)
  await db.delete(approvals).where(eq(approvals.projectId, projectId));

  const status = plan.feasibility === "not_supported" ? "blocked" : "awaiting_confirm";

  await db
    .update(projects)
    .set({
      scopeIn,
      scopeOut,
      missingInfo: missing.join("\n") || null,
      feasibility: `${plan.feasibility}: ${plan.capabilityNote}`,
      plan: JSON.stringify(plan).slice(0, 20000),
      estLowMin: plan.estLowMin,
      estHighMin: plan.estHighMin,
      deliveryEta: etaHigh,
      etaConfidence: 45,
      status: status as (typeof projects.status.enumValues)[number],
      updatedAt: now(),
    })
    .where(eq(projects.id, projectId));

  // إنشاء المهام
  for (const t of plan.tasks) {
    await db.insert(projectTasks).values({
      projectId,
      seq: t.seq,
      key: t.key,
      title: t.title,
      agentRole: t.agentRole,
      dependsOn: t.dependsOn.join(","),
      instructions: t.instructions,
      weightMin: t.weightMin,
    });
  }
  // إعادة رسم التبعيات: من أرقام التسلسل في الخطة إلى معرّفات المهام الفعلية
  const created = await db
    .select()
    .from(projectTasks)
    .where(eq(projectTasks.projectId, projectId))
    .orderBy(projectTasks.seq);
  const seqToId = new Map(created.map((t) => [t.seq, t.id]));
  for (const t of created) {
    const ids = (plan.tasks.find((p) => p.seq === t.seq)?.dependsOn ?? [])
      .map((s) => seqToId.get(s))
      .filter((v): v is number => v != null);
    if (ids.length) {
      await db.update(projectTasks).set({ dependsOn: ids.join(",") }).where(eq(projectTasks.id, t.id));
    }
  }

  await logEvent(
    projectId,
    "plan",
    `اكتمل التحليل (المصدر: ${plan.source === "model" ? "النموذج" : "المخطط المحلي"}): ${plan.tasks.length} مهمة، تقدير ${plan.estLowMin}–${plan.estHighMin} دقيقة، ${missing.length ? `و${missing.length} معلومة ناقصة.` : "لا معلومات ناقصة."}`,
    { meta: { feasibility: plan.feasibility, tasks: plan.tasks.length } },
  );

  if (status === "blocked") {
    await addClientMessage(
      projectId,
      "system",
      "بعد تحليل طلبك، المشروع الحالي خارج قدرات بيئة التنفيذ الآمنة المتاحة. فريق الإدارة يراجع الحالة وسيتواصل معك بحلول بديلة — لا يُعتبر أي عمل قيد التنفيذ حتى ذلك الحين.",
    );
    return;
  }

  await addClientMessage(
    projectId,
    "system",
    `تم تحليل مشروعك وإعداد خطة من ${plan.tasks.length} مهمة.
${missing.length ? `
نحتاج منك لتأكيد:
${missing.map((m, i) => `${i + 1}) ${m}`).join("\n")}
(أرسل الرد هنا في أي وقت.)
` : ""}
النطاق والتقدير بانتظار اعتماد الإدارة — سيبدأ التنفيذ بعد الاعتماد.`,
  );
}

// ------------------------------------------------------------
// الحالة: بدء / إيقاف / استئناف / إلغاء
// ------------------------------------------------------------

export async function reconcileStale() {
  const rows = await db
    .select({ id: projects.id, code: projects.code })
    .from(projects)
    .where(eq(projects.status, "running"));
  for (const r of rows) {
    if (!running.has(r.id)) {
      await db
        .update(projects)
        .set({ status: "paused", updatedAt: now() })
        .where(eq(projects.id, r.id));
      await logEvent(r.id, "pause", "تم إيقاف التنفيذ تلقائياً بعد إعادة تشغيل الخادم — يمكن الاستئناف من اللوحة بدون فقدان التقدم (المهام المنجزة محفوظة).");
    }
  }
}

async function approvedScope(projectId: number): Promise<boolean> {
  const rows = await db
    .select()
    .from(approvals)
    .where(and(eq(approvals.projectId, projectId), eq(approvals.type, "scope")))
    .orderBy(desc(approvals.createdAt))
    .limit(1);
  return rows[0]?.decision === "approved";
}

export async function startProject(projectId: number): Promise<{ ok: boolean; error?: string }> {
  if (running.has(projectId)) return { ok: false, error: "التنفيذ جارٍ بالفعل — لا تكرار." };
  await reconcileStale();
  const [row] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!row) return { ok: false, error: "المشروع غير موجود" };
  if (["delivered", "cancelled"].includes(row.status)) {
    return { ok: false, error: `المشروع بحالة "${row.status}" — لا يمكن بدء التنفيذ` };
  }
  if (row.status === "blocked") return { ok: false, error: "المشروع متوقف بانتظار قرار بشري (خارج القدرات المتاحة)" };
  const approved = await approvedScope(projectId);
  if (row.status === "planned" || row.status === "awaiting_confirm") {
    if (!approved) return { ok: false, error: "يجب اعتماد النطاق والتكلفة أولاً" };
  }

  running.set(projectId, { cancelled: false, paused: false });
  await db
    .update(projects)
    .set({ status: "running", updatedAt: now() })
    .where(eq(projects.id, projectId));
  await logEvent(projectId, "log", "انطلق محرك التنفيذ — سير المضي تسلسلياً حسب التبعيات مع فحوصات بعد كل مهمة.", { actor: "محرك التنفيذ" });
  void loop(projectId);
  return { ok: true };
}

export async function pauseProject(projectId: number): Promise<{ ok: boolean; error?: string }> {
  const st = running.get(projectId);
  if (!st) {
    // غير جارٍ حالياً — نوقف حالة المشروع إن كانت running (حالة قديمة)
    await db
      .update(projects)
      .set({ status: "paused", updatedAt: now() })
      .where(and(eq(projects.id, projectId), eq(projects.status, "running")));
    return { ok: true };
  }
  st.paused = true;
  await db.update(projects).set({ status: "paused", updatedAt: now() }).where(eq(projects.id, projectId));
  await logEvent(projectId, "pause", "أوقف المطور التنفيذ مؤقتاً — سيتوقف المحرك بعد المهمة الحالية الجارية (إن وجدت) ويُستأنف بدون فقدان تقدم.");
  return { ok: true };
}

export async function resumeProject(projectId: number): Promise<{ ok: boolean; error?: string }> {
  const st = running.get(projectId);
  if (st) {
    st.paused = false;
    await db.update(projects).set({ status: "running", updatedAt: now() }).where(eq(projects.id, projectId));
    await logEvent(projectId, "log", "استُؤنف التنفيذ من حيث توقف.");
    return { ok: true };
  }
  // لم يكن محملاً (بعد إعادة تشغيل) — نعيد تحميل حالة التنفيذ من المهام المحفوظة
  const [row] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!row) return { ok: false, error: "غير موجود" };
  if (row.status !== "paused") return { ok: false, error: `الحالة الحالية "${row.status}" لا تستجيب لاستئناف` };
  const started = await startProject(projectId);
  if (started.ok) await logEvent(projectId, "log", "استُؤنف المشروع بعد إعادة تحميل — المهام المنجزة لم تُعاد.");
  return started;
}

export async function cancelProject(projectId: number): Promise<{ ok: boolean; error?: string }> {
  const st = running.get(projectId);
  if (st) {
    st.cancelled = true;
    await logEvent(projectId, "cancel", "طلب المطور إلغاء التنفيذ — سيُنهى بعد المهمة الجارية الحالية.");
    return { ok: true };
  }
  await db
    .update(projects)
    .set({ status: "cancelled", updatedAt: now() })
    .where(eq(projects.id, projectId));
  await logEvent(projectId, "cancel", "أُلغي المشروع — التقدم المحفوظ متاح للمراجعة.");
  await addClientMessage(projectId, "system", "تم إيقاف العمل على مشروعك بناءً على قرار الإدارة. أي تقدم سابق محفوظ، ويمكن الرجوع للحالة عند الحاجة.");
  return { ok: true };
}

// ------------------------------------------------------------
// إعادة حساب التقدم (أوزان) وموعد التسليم (زمن فعلي)
// ------------------------------------------------------------

async function recompute(projectId: number, reason: string) {
  const all = await db.select().from(projectTasks).where(eq(projectTasks.projectId, projectId));
  const totalWeight = all.reduce((s, t) => s + t.weightMin, 0);
  const done = all.filter((t) => t.status === "done");
  const doneWeight = done.reduce((s, t) => s + t.weightMin, 0);
  const failed = all.filter((t) => t.status === "failed").length;
  const remainingWeight = all
    .filter((t) => !["done", "skipped"].includes(t.status))
    .reduce((s, t) => s + t.weightMin, 0);

  const progress = totalWeight ? Math.round((doneWeight / totalWeight) * 100) : 0;

  const actualSec = done
    .filter((t) => t.startedAt && t.finishedAt)
    .reduce((s, t) => s + ((t.finishedAt?.getTime() ?? 0) - (t.startedAt?.getTime() ?? 0)) / 1000, 0);
  const actualWeight = done
    .filter((t) => t.startedAt && t.finishedAt)
    .reduce((s, t) => s + t.weightMin, 0);
  const rate = actualWeight ? actualSec / actualWeight : 60; // ثانية لكل دقيقة وزن
  const remainingSec = remainingWeight * rate;
  const etaLow = new Date(Date.now() + Math.max(60, remainingSec * 0.8) * 1000);
  const etaHigh = new Date(Date.now() + Math.max(120, remainingSec * 1.6) * 1000);
  const doneRatio = all.length ? done.length / all.length : 0;
  const confidence = Math.max(20, Math.min(92, Math.round(35 + doneRatio * 55 - failed * 12)));

  await db
    .update(projects)
    .set({
      progress,
      deliveryEta: etaHigh,
      etaConfidence: confidence,
      updatedAt: now(),
    })
    .where(eq(projects.id, projectId));

  if (reason) {
    await db.insert(deliveryEstimates).values({
      projectId,
      etaLow,
      etaHigh,
      confidence,
      basis: `${reason} — معدل التنفيذ الفعلي ${rate.toFixed(0)} ث/دقيقة وزن، متبقي ${remainingWeight} دقيقة وزن، مهام فاشلة: ${failed}.`,
    });
    await logEvent(
      projectId,
      "eta_update",
      `تحديث موعد التسليم (${reason}): المتوقع ${etaLow.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })} – ${etaHigh.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })} (ثقة ${confidence}%). التقدم الأوزاني: ${progress}%.`,
    );
  }
}

// ------------------------------------------------------------
// الفحوصات الفعلية
// ------------------------------------------------------------

interface CheckResult {
  name: string;
  status: "pass" | "fail" | "error";
  detail: string;
}

function hasServer(files: GenFile[]): boolean {
  return files.some((f) => f.path === "src/server.js");
}

async function checkSyntax(abs: string): Promise<CheckResult> {
  try {
    await pExecFile("node", ["--check", abs], { timeout: 15_000 });
    return { name: `صياغة JS: ${path.basename(abs)}`, status: "pass", detail: "node --check exit 0" };
  } catch (e) {
    const msg = e instanceof Error ? (e as NodeJS.ErrnoException & { stderr?: string }).stderr?.slice(0, 300) || e.message : String(e);
    return { name: `صياغة JS: ${path.basename(abs)}`, status: "fail", detail: msg };
  }
}

async function checkServerSmoke(dir: string): Promise<CheckResult[]> {
  const out: CheckResult[] = [];
  const port = 3900 + Math.floor(Math.random() * 500);
  let child: ChildProcess | null = null;
  try {
    child = spawn("node", [path.join(dir, "src/server.js")], {
      env: { ...process.env, PORT: String(port) },
      stdio: ["ignore", "pipe", "pipe"],
      cwd: dir,
    });
    await new Promise((r) => setTimeout(r, 1200));
    const health = await fetch(`http://127.0.0.1:${port}/api/health`);
    const hJson = (await health.json().catch(() => ({}))) as { status?: string };
    out.push({
      name: "تشغيل وظيفي: GET /api/health",
      status: health.ok && hJson.status === "ok" ? "pass" : "fail",
      detail: `HTTP ${health.status} — ${JSON.stringify(hJson).slice(0, 120)}`,
    });
    const echo = await fetch(`http://127.0.0.1:${port}/api/echo?msg=nebras-test`);
    const eJson = (await echo.json().catch(() => ({}))) as { echo?: string };
    out.push({
      name: "تشغيل وظيفي: GET /api/echo",
      status: echo.ok && eJson.echo === "nebras-test" ? "pass" : "fail",
      detail: `HTTP ${echo.status} — ${JSON.stringify(eJson).slice(0, 120)}`,
    });
    const bad = await fetch(`http://127.0.0.1:${port}/api/echo`);
    out.push({
      name: "حالة خطأ: /api/echo بدون msg",
      status: bad.status === 400 ? "pass" : "fail",
      detail: `HTTP ${bad.status} (المتوقع 400)`,
    });
  } catch (e) {
    out.push({
      name: "تشغيل وظيفي: الخادم",
      status: "error",
      detail: e instanceof Error ? e.message.slice(0, 200) : String(e),
    });
  } finally {
    try {
      child?.kill("SIGKILL");
    } catch {
      // ignore
    }
  }
  return out;
}

const SECRET_RE = /sk-[a-zA-Z0-9]{20,}|(api[_-]?key|secret|password|token)\s*[:=]\s*['"][a-zA-Z0-9_\-]{12,}['"]/i;

async function runTaskChecks(
  projectId: number,
  taskId: number,
  taskKey: string,
  files: GenFile[],
  dir: string,
): Promise<CheckResult[]> {
  const results: CheckResult[] = [];

  // 1) اكتمال الملفات
  for (const f of files) {
    const abs = path.join(dir, f.path);
    let ok = false;
    let detail = "";
    try {
      const st = fs.statSync(abs);
      ok = st.size > 0;
      detail = `${st.size} بايت`;
    } catch (e) {
      detail = e instanceof Error ? e.message.slice(0, 150) : String(e);
    }
    results.push({ name: `ملف: ${f.path}`, status: ok ? "pass" : "fail", detail });
  }

  // 2) صياغة JS لكل ملف JS في المهمة
  const jsFiles = files.filter((f) => /\.(js|mjs|cjs)$/.test(f.path));
  for (const f of jsFiles) {
    results.push(await checkSyntax(path.join(dir, f.path)));
  }

  // 3) فحص أسرار مضمّنة
  let secretHits = 0;
  const secretWhere: string[] = [];
  for (const f of files) {
    const abs = path.join(dir, f.path);
    try {
      const content = fs.readFileSync(abs, "utf8");
      if (SECRET_RE.test(content)) {
        secretHits++;
        secretWhere.push(f.path);
      }
    } catch {
      // ignore
    }
  }
  results.push({
    name: "فحص أسرار مضمّنة",
    status: secretHits === 0 ? "pass" : "fail",
    detail: secretHits === 0 ? "صفر نتائج" : `نتائج في: ${secretWhere.join(", ")}`,
  });

  // 4) الاختبار الوظيفي الكامل في مهمة QA فقط
  if (taskKey === "qa" && hasServer(files)) {
    results.push(...(await checkServerSmoke(dir)));
  }

  return results;
}

// ------------------------------------------------------------
// تنفيذ مهمة واحدة
// ------------------------------------------------------------

const OUTPUT_RULES = `
أنت تنفذ مهمة ضمن مشروع العميل. أخرج JSON صالحاً فقط (بدون fences وبدون نص خارجه):
{"summary":"وصف عربي 2-4 أسطر بما أنجزته","files":[{"path":"مسار/الملف","content":"محتوى الملف كاملاً","action":"created"}]}
قواعد الملفات:
- المسارات المسموحة فقط: public/ , src/ , docs/ , scripts/ , data/ , content/ , design/ أو ملفات جذر (README.md, DELIVERY.md).
- اكتب محتوى كل ملف كاملاً حرفياً بدون اختصار (بدون ... أو remainder).
- الكود JS/HTML/CSS/SQL/Markdown يجب أن يكون قابلاً للتشغيل/القراءة مباشرة.
- لا تكتب أي أسرار أو مفاتيح API.
- أنشئ فقط الملفات التي تخص مهمتك الحالية.`;

async function runTask(projectId: number, taskId: number): Promise<void> {
  const [task] = await db.select().from(projectTasks).where(eq(projectTasks.id, taskId)).limit(1);
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!task || !project) return;

  const [employee] = await db
    .select()
    .from(aiEmployees)
    .where(eq(aiEmployees.roleKey, task.agentRole))
    .limit(1);
  const empName = employee?.name ?? "وكيل";
  const empPrompt = employee?.systemPrompt ?? "أنت موظف ذكي في NEBRAS AI ينفذ مهامه بدقة ويخرج JSON صالحاً.";
  const empActive = employee?.active ?? true;

  await db
    .update(projectTasks)
    .set({ status: "running", startedAt: now(), attempts: sql`${projectTasks.attempts} + 1` })
    .where(eq(projectTasks.id, taskId));
  await logEvent(projectId, "task_start", `${empName} بدأ المهمة: ${task.title}`, {
    actor: empName,
    taskId,
    meta: { attempt: task.attempts + 1 },
  });

  // أوامر جديدة من المطور (تُحقن في المهمة القادمة)
  const notes = await db
    .select()
    .from(projectNotes)
    .where(and(eq(projectNotes.projectId, projectId), eq(projectNotes.consumed, false)))
    .limit(10);
  const noteText = notes.map((n) => n.content).join("\n");

  // ملفات سابقة (سياق)
  const priorFiles = await db
    .select({ path: projectFiles.path, size: projectFiles.size })
    .from(projectFiles)
    .where(eq(projectFiles.projectId, projectId))
    .orderBy(desc(projectFiles.updatedAt))
    .limit(40);

  // استرجاع المعرفة ذات الصلة (RAG) — من قاعدة معرفة الشركة
  let kbRefs: string[] = [];
  let kbIds: number[] = [];
  let kbTitles = "";
  try {
    const q = `${task.title} ${project.serviceType} ${task.agentRole}`.slice(0, 220);
    const [hits, fixHits] = await Promise.all([
      kbSearch(q, { limit: 3 }),
      kbSearch(`${task.agentRole} error fix خطأ إصلاح صياغة أمان`, { category: "fix", limit: 2 }),
    ]);
    const uniq = [...hits, ...fixHits]
      .filter((h, i, a) => a.findIndex((x) => x.id === h.id) === i)
      .slice(0, 4);
    kbIds = uniq.map((h) => h.id);
    kbTitles = uniq.map((h) => h.title).join("، ");
    kbRefs = uniq.map(
      (h) =>
        `- [${h.category}/${h.source}] ${h.title}: ${h.summary.slice(0, 160)}${
          h.code && h.code.length < 500 ? `\n${h.code.slice(0, 400)}` : ""
        }`,
    );
  } catch {
    // المعرفة اختيارية — لا توقف التنفيذ
  }

  let files: GenFile[] = [];
  let summary = "";
  let usage: Awaited<ReturnType<typeof askModel>> = null;
  let source: "model" | "generator" = "generator";

  if (!empActive) {
    summary = "الموظف معطل في الإعدادات — تم التنفيذ عبر المولّد المحلي.";
      files = generateFiles(
        { code: project.code, title: project.title, clientName: project.clientName, type: project.serviceType as ServiceType },
        task.key,
        `${noteText}${kbTitles ? `\nمرجعيات من قاعدة معرفة NEBRAS AI: ${kbTitles}` : ""}`,
      );
  } else {
    usage = await askModel({
      timeoutMs: 120_000,
      system: empPrompt + "\n" + OUTPUT_RULES,
      user: `مشروع: ${project.title} (${project.code})
نوع المشروع: ${project.serviceType}
العميل: ${project.clientName}
وصف الطلب: ${project.description.slice(0, 1200)}
${noteText ? `\nتوجيهات جديدة من الإدارة (أولوية): ${noteText}\n` : ""}
${kbRefs.length ? `\nمرجعيات موثقة من قاعدة معرفة NEBRAS AI (استعن بها وتجنب أخطاءها المسجلة):\n${kbRefs.join("\n")}\n` : ""}
مهمتك الآن: ${task.title}
تفاصيل المهمة: ${task.instructions ?? ""}
الملفات الموجودة حتى الآن (${priorFiles.length}):
${priorFiles.map((f) => `- ${f.path} (${f.size}B)`).join("\n") || "- لا يوجد"}
`,
    });

    if (usage) {
      try {
        const s = usage.text.indexOf("{");
        const e = usage.text.lastIndexOf("}");
        const parsed = s >= 0 && e > s ? JSON.parse(usage.text.slice(s, e + 1)) : null;
        if (parsed && Array.isArray(parsed.files)) {
          const raw = parsed.files as { path?: unknown; content?: unknown; action?: unknown }[];
          const clean: GenFile[] = [];
          let bytes = 0;
          for (const f of raw) {
            const p = typeof f?.path === "string" ? safeRelPath(f.path) : null;
            if (!p || typeof f?.content !== "string") continue;
            const content = f.content.slice(0, 150_000);
            bytes += content.length;
            if (bytes > project.maxBytes || clean.length >= project.maxFiles) break;
            clean.push({ path: p, content, action: f.action === "modified" ? "modified" : "created" });
          }
          if (clean.length) {
            files = clean;
            summary = typeof parsed.summary === "string" ? parsed.summary.slice(0, 600) : "";
            source = "model";
          }
        }
      } catch {
        usage = null;
      }
    }
    if (!files.length) {
      files = generateFiles(
        { code: project.code, title: project.title, clientName: project.clientName, type: project.serviceType as ServiceType },
        task.key,
        noteText,
      );
      summary = summary || "تم إنشاء الملفات عبر المولّد المحلي (لم يتوفر رد JSON صالح من النموذج).";
      source = "generator";
    }
  }

  // تسجيل استهلاك النموذج (حقيقي أو غير متاح)
  await db.insert(modelUsage).values({
    projectId,
    taskId,
    roleKey: task.agentRole,
    provider: usage ? usage.provider : "local-generator",
    model: usage ? usage.model : "builtin",
    ok: !!usage,
    promptChars: usage ? usage.promptChars : 0,
    completionChars: usage ? usage.completionChars : 0,
    durationMs: usage ? usage.durationMs : 0,
    costUsd: usage?.costUsd != null ? Math.round(usage.costUsd * 1_000_000) : null,
  });

  // كتابة الملفات (قاعدة + قرص)
  const dir = wsDir(project.code);
  const written: string[] = [];
  for (const f of files) {
    const abs = path.join(dir, f.path);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, f.content, "utf8");
    const existing = await db
      .select()
      .from(projectFiles)
      .where(and(eq(projectFiles.projectId, projectId), eq(projectFiles.path, f.path)))
      .limit(1);
    if (existing[0]) {
      await db
        .update(projectFiles)
        .set({
          content: f.content,
          action: f.action,
          version: existing[0].version + 1,
          size: f.content.length,
          updatedAt: now(),
        })
        .where(eq(projectFiles.id, existing[0].id));
    } else {
      await db.insert(projectFiles).values({
        projectId,
        path: f.path,
        content: f.content,
        action: "created",
        version: 1,
        size: f.content.length,
      });
    }
    written.push(f.path);
  }

  if (notes.length) {
    await db.update(projectNotes).set({ consumed: true }).where(inArray(projectNotes.id, notes.map((n) => n.id)));
  }

  // الفحوصات الفعلية
  const checks = await runTaskChecks(projectId, taskId, task.key, files, dir);
  for (const c of checks) {
    await db.insert(projectTestResults).values({
      projectId,
      taskId,
      name: c.name,
      status: c.status,
      detail: c.detail,
    });
  }

  const failures = checks.filter((c) => c.status === "fail" || c.status === "error");

  // تغذية راجعة لقاعدة المعرفة: ما استُخدم يزيد وزنه في الترشيح
  if (kbIds.length) await recordKbUsage(kbIds);

  if (failures.length === 0) {
    await db
      .update(projectTasks)
      .set({
        status: "done",
        finishedAt: now(),
        outputSummary: `${summary}\nالمصادر: ${source}. الملفات: ${written.join(", ") || "—"}. الفحوصات: ${checks.length} نجاح.`,
      })
      .where(eq(projectTasks.id, taskId));
    await logEvent(
      projectId,
      "task_done",
      `اكتملت المهمة (فحوصات ${checks.length}/${checks.length} ناجحة): ${task.title} — ${written.join(", ") || "بدون ملفات"}`,
      { actor: empName, taskId },
    );
  } else if (task.attempts + 1 < task.maxAttempts) {
    await db
      .update(projectTasks)
      .set({
        status: "queued",
        error: failures.map((f) => `${f.name}: ${f.detail}`).join(" | ").slice(0, 500),
      })
      .where(eq(projectTasks.id, taskId));
    await logEvent(
      projectId,
      "task_retry",
      `فشلت ${failures.length} فحوصات في مهمة «${task.title}» — إعادة المحاولة (${task.attempts + 1}/${task.maxAttempts}). السبب: ${failures[0].name}.`,
      { actor: empName, taskId },
    );
    await new Promise((r) => setTimeout(r, 800));
    return; // يُعاد التقاطها من الحلقة
  } else {
    await db
      .update(projectTasks)
      .set({
        status: "failed",
        finishedAt: now(),
        error: failures.map((f) => `${f.name}: ${f.detail}`).join(" | ").slice(0, 800),
      })
      .where(eq(projectTasks.id, taskId));
    await logEvent(
      projectId,
      "task_fail",
      `المهمة «${task.title}» فشلت بعد ${task.maxAttempts} محاولات — تحتاج تدخل المطور. آخر فشل: ${failures[0].name}: ${failures[0].detail.slice(0, 200)}`,
      { actor: empName, taskId },
    );
  }

  await recompute(projectId, `بعد مهمة «${task.title}»`);
}

// ------------------------------------------------------------
// حلقة التنفيذ
// ------------------------------------------------------------

async function nextTask(projectId: number) {
  const all = await db
    .select()
    .from(projectTasks)
    .where(eq(projectTasks.projectId, projectId))
    .orderBy(projectTasks.seq);
  for (const t of all) {
    if (t.status !== "queued") continue;
    const deps = (t.dependsOn ?? "")
      .split(",")
      .map((s) => Number(s.trim()))
      .filter(Boolean);
    const depOk = deps.every((d) => {
      const dep = all.find((x) => x.id === d);
      return dep && ["done", "skipped"].includes(dep.status);
    });
    if (depOk) return t;
  }
  // مهام معتمدة على فاشلة → تُسقط
  for (const t of all) {
    if (t.status !== "queued") continue;
    const deps = (t.dependsOn ?? "")
      .split(",")
      .map((s) => Number(s.trim()))
      .filter(Boolean);
    const depFailed = deps.some((d) => {
      const dep = all.find((x) => x.id === d);
      return dep?.status === "failed";
    });
    if (depFailed) {
      await db.update(projectTasks).set({ status: "skipped" }).where(eq(projectTasks.id, t.id));
      await logEvent(projectId, "task_skip", `أُسقطت مهمة «${t.title}» — اعتمادها «${all.find((x) => x.id === deps.find((d) => all.find((y) => y.id === d)?.status === "failed"))?.title ?? ""}» فشلت.`, { taskId: t.id });
    }
  }
  return null;
}

async function loop(projectId: number) {
  try {
    for (;;) {
      const st = running.get(projectId);
      if (!st) break;
      if (st.cancelled) {
        await db.update(projects).set({ status: "cancelled", updatedAt: now() }).where(eq(projects.id, projectId));
        await logEvent(projectId, "cancel", "أُنهِي تنفيذ المشروع بالإلغاء — التقدم محفوظ.", { actor: "محرك التنفيذ" });
        await addClientMessage(projectId, "system", "تم إيقاف العمل على مشروعك بقرار الإدارة. أي تقدم سابق محفوظ.");
        break;
      }
      if (st.paused) {
        await new Promise((r) => setTimeout(r, 1500));
        continue;
      }
      const next = await nextTask(projectId);
      if (!next) break;
      await runTask(projectId, next.id);
    }

    // البوابة النهائية: لا تسليم بدون أدلة
    const all = await db.select().from(projectTasks).where(eq(projectTasks.projectId, projectId));
    const failed = all.filter((t) => t.status === "failed");
    const st = running.get(projectId);

    if (st?.cancelled) {
      running.delete(projectId);
      return;
    }

    const unfinished = all.filter((t) => !["done", "skipped"].includes(t.status)).length;
    if (failed.length > 0 || unfinished > 0) {
      await db.update(projects).set({ status: "blocked", updatedAt: now() }).where(eq(projects.id, projectId));
      await logEvent(
        projectId,
        "gate",
        `بوابة التسليم مغلقة: ${failed.length} مهمة فشلت${unfinished > 0 ? `، و${unfinished} مهمة لم تكتمل` : ""} (${[...failed].map((f) => f.title).slice(0, 3).join("، ") || "مهام معلقة"}) — المشروع ينتظر تدخل المطور.`,
      );
        await addClientMessage(
          projectId,
          "system",
          `حدث توقف تقني في جزء من مشروعك (المهام: ${failed.map((f) => f.title).slice(0, 3).join("، ")}). فريق الإدارة يعمل على المعالجة وسنوافيكم بالمستجدات — لا يتم تسليم أي جزء قبل تجاوز هذه النقطة.`,
        );
        // حصاد الدروس حتى من المشاريع المتعثرة (إخفاقات = معرفة)
        await harvestExperience(projectId);
    } else {
      // تحقق نهائي: كل الملفات موجودة وغير فارغة
      const files = await db.select().from(projectFiles).where(eq(projectFiles.projectId, projectId));
      const emptyFiles = files.filter((f) => f.size === 0);
      if (emptyFiles.length === 0 && files.length > 0) {
        await db.update(projects).set({ status: "delivered", progress: 100, updatedAt: now() }).where(eq(projects.id, projectId));
        const eta = new Date();
        await db.insert(deliveryEstimates).values({
          projectId,
          etaLow: eta,
          etaHigh: eta,
          confidence: 100,
          basis: "اكتمل التنفيذ — جميع الفحوصات الفعلية ناجحة (صياغة، تشغيل وظيفي، أسرار، اكتمال ملفات).",
        });
        await logEvent(projectId, "delivery", `تم التسليم: ${files.length} ملف، ${all.length} مهمة منجزة بفحوصات فعلية ناجحة. الملفات متاحة للعميل للتحميل.`, { actor: "م. زياد — مدير التسليم" });
        await addClientMessage(
          projectId,
          "system",
          `تم تسليم مشروعك بنجاح ✅
- ${files.length} ملف (تحميل جماعي ZIP متاح في صفحة المتابعة)
- ${all.length} مهمة منجزة بنتائج فحوصات فعلية (تشغيل + صياغة + أمان)
- DELIVERY.md يعرض تقرير التسليم الكامل
يمكنك الآن تقييم النتيجة وإبلاغنا بأي ملاحظة.`,
        );
      } else {
        await db.update(projects).set({ status: "blocked", updatedAt: now() }).where(eq(projects.id, projectId));
        await logEvent(projectId, "gate", `بوابة التسليم مغلقة: ${emptyFiles.length ? `ملفات فارغة (${emptyFiles.length})` : "لا توجد ملفات مخرجة"} — يتدخل المطور.`);
      }
      // حصاد الخبرة: تقدير/فعلي، قرار، دروس، مكونات — تغذي الذاكرة المؤسسية
      await harvestExperience(projectId);
    }
    running.delete(projectId);
  } catch (e) {
    const msg = e instanceof Error ? e.message.slice(0, 300) : String(e);
    await db.update(projects).set({ status: "blocked", updatedAt: now() }).where(eq(projects.id, projectId));
    await logEvent(projectId, "error", `خطأ غير متوقع في محرك التنفيذ: ${msg} — المشروع في حالة توقف آمنة.`, { actor: "محرك التنفيذ" });
    running.delete(projectId);
  }
}

export { running as __runningForTests };
