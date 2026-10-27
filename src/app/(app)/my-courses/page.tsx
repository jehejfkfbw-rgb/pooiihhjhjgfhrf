import type { Metadata } from "next";
import Link from "next/link";
import { getUserCourses } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Badge, EmptyState, ProgressBar } from "@/components/ui";
import { CourseCover } from "@/components/course-cover";
import { UnenrollButton } from "@/components/course-row-actions";
import { AppSectionTitle } from "@/components/app-shell";
import { IconBookOpen, IconChevronLeft, IconClock, IconPlay } from "@/components/icons";
import { cn, formatDuration } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "كورساتي" };

const FILTERS = [
  { key: "all", label: "الكل" },
  { key: "in_progress", label: "قيد التقدّم" },
  { key: "completed", label: "مكتملة" },
  { key: "not_started", label: "لم تبدأ" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

export default async function MyCoursesPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/my-courses");

  const sp = await searchParams;
  const filter = (FILTERS.find((f) => f.key === sp.filter)?.key ?? "all") as FilterKey;
  const all = await getUserCourses(user.id);

  const items = all.filter((c) => {
    if (filter === "all") return true;
    if (filter === "completed") return c.progress >= 100;
    if (filter === "in_progress") return c.progress > 0 && c.progress < 100;
    return c.progress === 0;
  });

  const counts = {
    all: all.length,
    in_progress: all.filter((c) => c.progress > 0 && c.progress < 100).length,
    completed: all.filter((c) => c.progress >= 100).length,
    not_started: all.filter((c) => c.progress === 0).length,
  };

  const totalLessons = all.reduce((s, c) => s + c.totalLessons, 0);
  const doneLessons = all.reduce((s, c) => s + c.completedLessons, 0);

  return (
    <div className="space-y-5">
      {/* ملخّص */}
      <section className="relative overflow-hidden rounded-3xl bg-navy-800 p-5">
        <div className="grid-paper absolute inset-0 opacity-40" />
        <div className="relative flex items-center justify-between gap-4">
          <div>
            <p className="text-[0.7rem] font-bold text-gold-400">رحلتك التعليمية</p>
            <p className="mt-1 font-display text-xl font-extrabold text-white tabular-nums">
              {all.length} <span className="text-sm font-bold text-mist-300">كورس</span>
            </p>
            <p className="mt-1 text-[0.7rem] font-semibold text-mist-300">
              {doneLessons} من {totalLessons} درس مكتمل · {counts.completed} شهادة
            </p>
          </div>
          <Link href="/library" className="btn btn-gold btn-sm shrink-0">
            <IconBookOpen className="h-4 w-4" />
            أضف كورسًا
          </Link>
        </div>
      </section>

      {/* التصنيفات */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key === "all" ? "/my-courses" : `/my-courses?filter=${f.key}`}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-extrabold transition",
              filter === f.key ? "border-navy-700 bg-navy-700 text-white" : "border-mist-200 bg-white text-mist-600",
            )}
            aria-current={filter === f.key ? "page" : undefined}
          >
            {f.label}
            <span className={cn("rounded-full px-1.5 text-[0.62rem] tabular-nums", filter === f.key ? "bg-white/20" : "bg-mist-100")}>
              {counts[f.key]}
            </span>
          </Link>
        ))}
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<IconBookOpen className="h-6 w-6" />}
          title={filter === "all" ? "لم تسجّل في أي كورس بعد" : "لا كورسات في هذا التصنيف"}
          description={filter === "all" ? "افتح المكتبة واختر كورسك الأول." : "جرّب تصنيفًا آخر."}
          action={<Link href="/library" className="btn btn-primary btn-sm">اذهب إلى المكتبة</Link>}
        />
      ) : (
        <div className="space-y-2.5">
          <AppSectionTitle title={filter === "all" ? "كل كورساتك" : FILTERS.find((f) => f.key === filter)?.label ?? ""} />
          {items.map((c) => (
            <article key={c.enrollment.id} className="overflow-hidden rounded-2xl border border-mist-200 bg-white shadow-card">
              <Link href={`/learn/${c.slug}`} className="flex items-center gap-3 p-3">
                <div className="relative w-20 shrink-0 overflow-hidden rounded-xl">
                  <CourseCover seed={c.slug} accent={c.stage?.accent} compact className="h-16" />
                  {c.progress >= 100 && (
                    <span className="absolute inset-0 flex items-center justify-center bg-success/85 text-[0.6rem] font-extrabold text-white">مكتمل</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-xs font-extrabold leading-6 text-navy-800">{c.title}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-2.5 text-[0.64rem] font-semibold text-mist-500">
                    <span>{c.stage?.name}</span>
                    <span className="inline-flex items-center gap-1"><IconClock className="h-3.5 w-3.5" />{formatDuration(c.durationMinutes)}</span>
                  </p>
                </div>
                <IconChevronLeft className="h-4 w-4 shrink-0 text-mist-300" />
              </Link>

              <div className="border-t border-mist-100 px-3 py-2.5">
                <div className="mb-2 flex items-center justify-between text-[0.66rem] font-bold text-mist-500">
                  <span>{c.completedLessons} من {c.totalLessons} درس</span>
                  <span className="tabular-nums text-navy-700">{c.progress}٪</span>
                </div>
                <ProgressBar value={c.progress} tone={c.progress >= 100 ? "success" : "navy"} />
                <div className="mt-2.5 flex items-center justify-between gap-2">
                  <Link href={`/learn/${c.slug}`} className="btn btn-primary btn-sm">
                    <IconPlay className="h-3.5 w-3.5" />
                    {c.progress >= 100 ? "مراجعة" : c.progress > 0 ? "متابعة" : "ابدأ"}
                  </Link>
                  <div className="flex items-center gap-1.5">
                    <Link href={`/courses/${c.slug}`} className="rounded-lg px-2 py-1 text-[0.66rem] font-bold text-mist-500 transition hover:bg-mist-100">التفاصيل</Link>
                    <UnenrollButton courseId={c.id} courseTitle={c.title} />
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
