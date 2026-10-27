import type { Metadata } from "next";
import Link from "next/link";
import { getUserCourses, listCourses, listStages, listSubjects } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Badge, Card, EmptyState, ProgressBar } from "@/components/ui";
import { CourseCover } from "@/components/course-cover";
import {
  IconBookOpen, IconChevronLeft, IconClock, IconLayers, IconSearch, IconTarget, StageIcon,
} from "@/components/icons";
import { cn, formatDuration, LEVEL_LABEL } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "المكتبة" };

const LEVELS = [
  { value: "beginner", label: "مبتدئ" },
  { value: "intermediate", label: "متوسط" },
  { value: "advanced", label: "متقدم" },
];

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; stage?: string; subject?: string; level?: string; page?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/library");

  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const pageSize = 8;

  const [stageRows, subjectRows, result, mine] = await Promise.all([
    listStages(true),
    listSubjects(sp.stage, true),
    listCourses({ stageId: sp.stage, subjectId: sp.subject, level: sp.level, search: sp.q, limit: pageSize, offset: (page - 1) * pageSize }),
    getUserCourses(user.id),
  ]);

  const progressById = new Map(mine.map((c) => [c.id, c.progress]));
  const enrolledIds = new Set(mine.map((c) => c.id));
  const totalPages = Math.max(1, Math.ceil(result.total / pageSize));

  const href = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    const merged = { q: sp.q, stage: sp.stage, subject: sp.subject, level: sp.level, ...patch };
    Object.entries(merged).forEach(([k, v]) => v && next.set(k, v));
    const qs = next.toString();
    return qs ? `/library?${qs}` : "/library";
  };

  return (
    <div className="space-y-5">
      {/* البحث */}
      <form method="get" action="/library" className="relative" role="search">
        {sp.stage && <input type="hidden" name="stage" value={sp.stage} />}
        {sp.subject && <input type="hidden" name="subject" value={sp.subject} />}
        {sp.level && <input type="hidden" name="level" value={sp.level} />}
        <IconSearch className="pointer-events-none absolute right-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-mist-400" />
        <input
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="ابحث عن كورس أو مادة…"
          aria-label="البحث في المكتبة"
          className="field rounded-2xl py-3 pr-11 shadow-card"
        />
      </form>

      {/* رقائق المراحل */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Link
          href={href({ stage: undefined, subject: undefined })}
          className={cn(
            "flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-extrabold transition",
            !sp.stage ? "border-navy-700 bg-navy-700 text-white" : "border-mist-200 bg-white text-mist-600",
          )}
        >
          <IconLayers className="h-4 w-4" />
          الكل
        </Link>
        {stageRows.map((stage) => {
          const active = sp.stage === stage.id;
          return (
            <Link
              key={stage.id}
              href={href({ stage: active ? undefined : stage.id, subject: undefined })}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-extrabold transition",
                active ? "border-navy-700 bg-navy-700 text-white" : "border-mist-200 bg-white text-mist-600",
              )}
            >
              <StageIcon iconKey={stage.iconKey} className="h-4 w-4" style={{ color: active ? undefined : stage.accent ?? undefined }} />
              {stage.name}
            </Link>
          );
        })}
      </div>

      {/* رقائق المواد والمستويات */}
      {(subjectRows.length > 0 || sp.stage) && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {subjectRows.map((subject) => {
            const active = sp.subject === subject.id;
            return (
              <Link
                key={subject.id}
                href={href({ subject: active ? undefined : subject.id })}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1.5 text-[0.7rem] font-bold transition",
                  active ? "border-gold-500 bg-gold-100 text-gold-700" : "border-mist-200 bg-white text-mist-600",
                )}
              >
                {subject.name}
              </Link>
            );
          })}
          <span className="mx-1 w-px shrink-0 bg-mist-200" />
          {LEVELS.map((level) => {
            const active = sp.level === level.value;
            return (
              <Link
                key={level.value}
                href={href({ level: active ? undefined : level.value })}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1.5 text-[0.7rem] font-bold transition",
                  active ? "border-navy-600 bg-navy-600 text-white" : "border-mist-200 bg-white text-mist-600",
                )}
              >
                {level.label}
              </Link>
            );
          })}
        </div>
      )}

      <p className="text-[0.7rem] font-bold text-mist-500">
        {result.total} كورس {sp.q ? `لبحث «${sp.q}»` : "متاح"} {sp.stage ? `في ${stageRows.find((s) => s.id === sp.stage)?.name ?? ""}` : ""}
      </p>

      {/* قائمة الكورسات */}
      {result.items.length ? (
        <div className="space-y-2.5">
          {result.items.map((course) => {
            const progress = progressById.get(course.id);
            const isMine = enrolledIds.has(course.id);
            return (
              <Link key={course.id} href={isMine ? `/learn/${course.slug}` : `/courses/${course.slug}`}>
                <Card className="flex items-center gap-3 p-3 transition active:scale-[0.99]">
                  <div className="w-20 shrink-0 overflow-hidden rounded-xl">
                    <CourseCover seed={course.slug} accent={course.stage?.accent} compact className="h-16" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-xs font-extrabold leading-6 text-navy-800">{course.title}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[0.64rem] font-semibold text-mist-500">
                      <span className="inline-flex items-center gap-1"><IconBookOpen className="h-3.5 w-3.5" />{course.lessonCount} درس</span>
                      <span className="inline-flex items-center gap-1"><IconClock className="h-3.5 w-3.5" />{formatDuration(course.durationMinutes)}</span>
                      <span>{LEVEL_LABEL[course.level]}</span>
                    </p>
                    {progress !== undefined ? (
                      <div className="mt-1.5">
                        <ProgressBar value={progress} tone={progress >= 100 ? "success" : "navy"} />
                      </div>
                    ) : (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {course.stage && <Badge tone="muted">{course.stage.name}</Badge>}
                        {course.isFeatured && <Badge tone="gold">مميّز</Badge>}
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-center gap-1.5">
                    {isMine ? <Badge tone="success">مسجّل</Badge> : <Badge tone="navy">مجاني</Badge>}
                    <IconChevronLeft className="h-4 w-4 text-mist-300" />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<IconSearch className="h-6 w-6" />}
          title="لا نتائج مطابقة"
          description="جرّب كلمة أخرى أو امسح عوامل التصفية."
          action={<Link href="/library" className="btn btn-primary btn-sm">عرض كل الكورسات</Link>}
        />
      )}

      {/* ترقيم */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pb-2">
          {page > 1 && <Link href={href({ page: String(page - 1) })} className="btn btn-outline btn-sm">السابق</Link>}
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-mist-500">
            <IconTarget className="h-4 w-4 text-navy-400" />
            {page} / {totalPages}
          </span>
          {page < totalPages && <Link href={href({ page: String(page + 1) })} className="btn btn-primary btn-sm">التالي</Link>}
        </div>
      )}
    </div>
  );
}
