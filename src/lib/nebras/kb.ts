// ============================================================
// NEBRAS AI — قاعدة المعرفة والذاكرة المؤسسية
// - بحث ذكي (Full-Text Search) بـ PostgreSQL
// - تغذية محرك التنفيذ بالمعرفة ذات الصلة (RAG)
// - حصاد الخبرات من كل مشروع مسلَّم (قرارات، دروس، إصلاحات، مكونات)
// - معايرة تقديرات المدة من السجل التاريخي
// ============================================================

import { eq, and, desc, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  knowledgeEntries,
  knowledgeTopics,
  projectTasks,
  projectFiles,
  projects,
  projectDecisions,
  projectLessons,
  errorFixes,
  reusableComponents,
  projectEstimateRecords,
} from "@/db/schema";

export interface KbHit {
  id: number;
  title: string;
  category: string;
  topicKey: string;
  language: string | null;
  tech: string | null;
  version: string | null;
  summary: string;
  content: string;
  code: string | null;
  source: string;
  license: string | null;
  sourceUrl: string | null;
  usageCount: number;
  verified: boolean;
  tags: string | null;
  rank: number;
}

const vec = sql`to_tsvector('simple',
  coalesce(${knowledgeEntries.title}, ' ') || ' ' ||
  coalesce(${knowledgeEntries.summary}, ' ') || ' ' ||
  coalesce(${knowledgeEntries.content}, ' ') || ' ' ||
  coalesce(${knowledgeEntries.tags}, ' ') || ' ' ||
  coalesce(${knowledgeEntries.tech}, ' ') || ' ' ||
  coalesce(${knowledgeEntries.language}, ' '))`;

/** بحث ذكي: FTS + احتياطي ILIKE — يرجع أعلى النتائج ترشيحاً */
export async function kbSearch(
  query: string,
  opts: { category?: string; limit?: number } = {},
): Promise<KbHit[]> {
  const q = query.trim();
  const limit = opts.limit ?? 5;
  if (!q) return [];
  try {
    let rows: KbHit[] = [];
    try {
      rows = (await db
        .select({
          id: knowledgeEntries.id,
          title: knowledgeEntries.title,
          category: knowledgeEntries.category,
          topicKey: knowledgeEntries.topicKey,
          language: knowledgeEntries.language,
          tech: knowledgeEntries.tech,
          version: knowledgeEntries.version,
          summary: knowledgeEntries.summary,
          content: knowledgeEntries.content,
          code: knowledgeEntries.code,
          source: knowledgeEntries.source,
          license: knowledgeEntries.license,
          sourceUrl: knowledgeEntries.sourceUrl,
          usageCount: knowledgeEntries.usageCount,
          verified: knowledgeEntries.verified,
          tags: knowledgeEntries.tags,
          rank: sql<number>`ts_rank(${vec}, plainto_tsquery('simple', ${q}))::float8`,
        })
        .from(knowledgeEntries)
        .where(
          opts.category
            ? and(
                sql`${vec} @@ plainto_tsquery('simple', ${q})`,
                eq(knowledgeEntries.category, opts.category),
              )
            : sql`${vec} @@ plainto_tsquery('simple', ${q})`,
        )
        .limit(Math.max(limit * 4, 12))) as KbHit[];
    } catch {
      rows = [];
    }
    if (rows.length === 0) {
      // احتياطي: مطابقة جزئية على العنوان/التقنية
      const like = `%${q.split(" ")[0].slice(0, 40)}%`;
      rows = (await db
        .select({
          id: knowledgeEntries.id,
          title: knowledgeEntries.title,
          category: knowledgeEntries.category,
          topicKey: knowledgeEntries.topicKey,
          language: knowledgeEntries.language,
          tech: knowledgeEntries.tech,
          version: knowledgeEntries.version,
          summary: knowledgeEntries.summary,
          content: knowledgeEntries.content,
          code: knowledgeEntries.code,
          source: knowledgeEntries.source,
          license: knowledgeEntries.license,
          sourceUrl: knowledgeEntries.sourceUrl,
          usageCount: knowledgeEntries.usageCount,
          verified: knowledgeEntries.verified,
          tags: knowledgeEntries.tags,
          rank: sql<number>`0.0001`,
        })
        .from(knowledgeEntries)
        .where(
          opts.category
            ? and(
                sql`${knowledgeEntries.title} ILIKE ${like} or ${knowledgeEntries.tech} ILIKE ${like}`,
                eq(knowledgeEntries.category, opts.category),
              )
            : sql`${knowledgeEntries.title} ILIKE ${like} or ${knowledgeEntries.tech} ILIKE ${like}`,
        )
        .limit(limit * 2)) as KbHit[];
    }
    rows.sort((a, b) => {
      if (a.verified !== b.verified) return a.verified ? -1 : 1;
      if (a.rank !== b.rank) return b.rank - a.rank;
      return b.usageCount - a.usageCount;
    });
    return rows.slice(0, limit);
  } catch {
    return [];
  }
}

/** تسجيل استخدام المدخلات (لموازنة الجودة والإحصاءات) */
export async function recordKbUsage(ids: number[]) {
  if (!ids.length) return;
  try {
    await db
      .update(knowledgeEntries)
      .set({
        usageCount: sql`${knowledgeEntries.usageCount} + 1`,
        lastUsedAt: new Date(),
      })
      .where(inArray(knowledgeEntries.id, ids));
  } catch {
    // غير حرج
  }
}

/**
 * حصاد الخبرات من مشروع مسلَّم — يغذي الذاكرة المؤسسية:
 * سجل تقدير/فعلي، قرار هندسي، دروس من الإخفاقات، ومكونات معاد استخدامها.
 * لا تُخزَّن أي بيانات شخصية أو أسرار — أنماط عامة فقط.
 */
export async function harvestExperience(projectId: number): Promise<void> {
  try {
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);
    if (!project || project.status !== "delivered") return;

    const tasks = await db
      .select()
      .from(projectTasks)
      .where(eq(projectTasks.projectId, projectId));
    const done = tasks.filter((t) => t.status === "done" && t.startedAt && t.finishedAt);
    const estLow = project.estLowMin ?? 0;
    const estHigh = project.estHighMin ?? 0;
    let actualSec = 0;
    if (done.length) {
      const min = Math.min(...done.map((t) => t.startedAt!.getTime()));
      const max = Math.max(...done.map((t) => t.finishedAt!.getTime()));
      actualSec = Math.max(1, Math.round((max - min) / 1000));
    } else {
      actualSec = 1;
    }

    // 1) سجل التقدير مقابل الفعلي (لتحسين المعايرة)
    await db.insert(projectEstimateRecords).values({
      projectId,
      serviceType: project.serviceType,
      estLowMin: estLow,
      estHighMin: estHigh,
      actualSec,
      taskCount: tasks.length,
    });

    // 2) القرار الهندسي (مع البدائل)
    await db.insert(projectDecisions).values({
      projectId,
      decision: `تبنّي خطة تنفيذ ${project.serviceType} بمكدس Node.js بدون تبعيات خارجية + مخطط PostgreSQL مقترح وتوثيق كامل`,
      reason: `المهام: ${tasks.length}، وزن استرشادي ${estLow}-${estHigh} دقيقة. البنية الصفرية التبعيات أسهل نشراً وأصغر مساحة هجمة، والمخرجات قابلة للتمديد.`,
      alternatives: "أطر كاملة (Next.js/Express) تُختار عندما يتطلب المشروع مصادقة حية أو قاعدة بيانات مفعلة — تُوثق في خطة المشروع.",
      by: "العقل المركزي",
    });

    // 3) دروس مستفادة من المهام المعاد محاولة إصلاحها
    for (const t of tasks) {
      if (t.attempts > 1) {
        await db.insert(projectLessons).values({
          projectId,
          category: t.status === "done" ? "process" : "error",
          problem: `مهمة «${t.title}» (${t.agentRole}) احتاجت ${t.attempts} محاولات`,
          solution:
            t.status === "done"
              ? "نجحت إعادة المحاولة — السبب الشائع: مخرجات ناقصة في أول محاولة، سُدَّت بفحص ما بعد كل مهمة."
              : "لم تكتمل — تطلب تدخلاً بشرياً أو إعادة تخطيط (مرجع: سجل المشروع).",
        });
      }
    }

    // 4) مكونات قابلة لإعادة الاستخدام (أصيلة الشركة — لا حقوق ملكية خارجية)
    const files = await db
      .select()
      .from(projectFiles)
      .where(eq(projectFiles.projectId, projectId));
    const known: { path: string; name: string; language: string; description: string }[] = [
      { path: "src/server.js", name: "Node server بدون تبعيات (قالب NEBRAS)", language: "JavaScript", description: "خادم http مدمج: ملفات ثابتة + /api/health + /api/echo مع تحقق مدخلات ومسارات آمنة." },
      { path: "public/styles.css", name: "ثيم داكن عربي RTL (هوية NEBRAS)", language: "CSS", description: "متغيرات ألوان وخطوط RTL مع تجاوب كامل." },
      { path: "design/tokens.css", name: "Design Tokens (RTL)", language: "CSS", description: "نظام ألوان/خطوط/مسافات متوافق مع RTL." },
      { path: "data/analysis.mjs", name: "سكريبت تحليل CSV بدون تبعيات", language: "JavaScript", description: "قراءة CSV وحساب مقاييس وكتابة report.json." },
      { path: "scripts/run.sh", name: "سكربت تشغيل آمن", language: "shell", description: "تشغيل مع متغيرات بيئة بدون أسرار." },
    ];
    for (const k of known) {
      const f = files.find((x) => x.path === k.path);
      if (!f) continue;
      const existing = await db
        .select()
        .from(reusableComponents)
        .where(eq(reusableComponents.name, k.name));
      if (existing.length) {
        await db
          .update(reusableComponents)
          .set({ timesUsed: existing[0].timesUsed + 1 })
          .where(eq(reusableComponents.id, existing[0].id));
      } else {
        await db.insert(reusableComponents).values({
          name: k.name,
          language: k.language,
          description: k.description,
          code: f.content.slice(0, 20_000),
          originProjectId: projectId,
          timesUsed: 1,
        });
      }
    }
  } catch (e) {
    console.error("harvestExperience error", e);
  }
}

/** معايرة التقدير من السجل التاريخي لنفس نوع الخدمة */
export async function calibrateEstimate(
  serviceType: string,
  estLow: number,
  estHigh: number,
): Promise<{ estLow: number; estHigh: number; note: string; sample: number }> {
  try {
    const rows = await db
      .select()
      .from(projectEstimateRecords)
      .where(eq(projectEstimateRecords.serviceType, serviceType))
      .orderBy(desc(projectEstimateRecords.createdAt))
      .limit(10);
    if (rows.length < 3) {
      return { estLow, estHigh, note: "لا سجل تاريخي كافٍ للمعايرة (≥3 مشاريع من نفس النوع)", sample: rows.length };
    }
    const avgEst = rows.reduce((s, r) => s + r.estLowMin, 0) / rows.length;
    const avgActualMin = rows.reduce((s, r) => s + r.actualSec / 60, 0) / rows.length;
    const ratio = Math.max(0.5, Math.min(2.5, avgActualMin / Math.max(1, avgEst)));
    return {
      estLow: Math.max(5, Math.round(estLow * ratio)),
      estHigh: Math.max(10, Math.round(estHigh * ratio)),
      note: `معايرة تاريخية: متوسط ${rows.length} مشاريع من نفس النوع (نسبة الفعلي/المقدَّر ${ratio.toFixed(2)})`,
      sample: rows.length,
    };
  } catch {
    return { estLow, estHigh, note: "المعايرة غير متاحة حالياً", sample: 0 };
  }
}

/** دروس وإصلاحات مرتبطة بنوع المشروع — تُحقن في التخطيط */
export async function relevantLessons(serviceType: string, limit = 3) {
  try {
    const fixes = await db
      .select()
      .from(errorFixes)
      .orderBy(desc(errorFixes.occurrences))
      .limit(limit);
    return fixes.map((f) => `${f.title}: ${f.fix.slice(0, 160)}`);
  } catch {
    return [] as string[];
  }
}

/** إحصاءات قاعدة المعرفة */
export async function kbStats() {
  try {
    const [totalRow, verifiedRow, topics, byCat, compRow, fixRow] = await Promise.all([
      db.select({ c: sql<number>`count(*)` }).from(knowledgeEntries),
      db.select({ c: sql<number>`count(*) filter (where verified)` }).from(knowledgeEntries),
      db.select().from(knowledgeTopics).orderBy(knowledgeTopics.id),
      db
        .select({ category: knowledgeEntries.category, c: sql<number>`count(*)` })
        .from(knowledgeEntries)
        .groupBy(knowledgeEntries.category),
      db.select({ c: sql<number>`count(*)` }).from(reusableComponents),
      db.select({ c: sql<number>`count(*)` }).from(errorFixes),
    ]);
    // دقة التقديرات: نسبة المتوسط الفعلي إلى المتوسط المقدر
    const est = await db
      .select({
        avgEst: sql<number>`avg(est_low_min)`,
        avgActMin: sql<number>`avg(actual_sec / 60.0)`,
        n: sql<number>`count(*)`,
      })
      .from(projectEstimateRecords);
    const e = est[0];
    const accuracy =
      e.n > 0 && e.avgEst != null && e.avgActMin != null && Number(e.avgEst) > 0
        ? Math.round(
            (1 - Math.abs(Number(e.avgActMin) - Number(e.avgEst)) / Number(e.avgEst)) * 100,
          )
        : null;
    return {
      total: Number(totalRow[0]?.c ?? 0),
      verified: Number(verifiedRow[0]?.c ?? 0),
      topics,
      byCategory: byCat,
      components: Number(compRow[0]?.c ?? 0),
      fixes: Number(fixRow[0]?.c ?? 0),
      estimateAccuracy: accuracy,
      estimateSamples: Number(e.n ?? 0),
    };
  } catch (e) {
    console.error("kbStats error", e);
    return { total: 0, verified: 0, topics: [], byCategory: [], components: 0, fixes: 0, estimateAccuracy: null, estimateSamples: 0 };
  }
}
