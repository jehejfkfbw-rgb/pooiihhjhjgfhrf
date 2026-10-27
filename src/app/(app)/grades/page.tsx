import type { Metadata } from "next";
import Link from "next/link";
import { getUserAttempts, getUserCourses, getUserStats } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Badge, Card, EmptyState } from "@/components/ui";
import { AppSectionTitle, ProgressRing } from "@/components/app-shell";
import { IconChart, IconClock, IconQuiz, IconTarget, IconTrend, IconTrophy } from "@/components/icons";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "درجاتي" };

export default async function GradesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/grades");

  const [attempts, stats, enrolled] = await Promise.all([
    getUserAttempts(user.id, 100),
    getUserStats(user.id),
    getUserCourses(user.id),
  ]);

  const passed = attempts.filter((a) => a.attempt.passed).length;
  const passRate = attempts.length ? Math.round((passed / attempts.length) * 100) : 0;

  const byCourse = new Map<string, { title: string; slug: string | null; attempts: number; best: number; sum: number }>();
  attempts.forEach(({ attempt, courseTitle, courseId }) => {
    const key = courseId ?? attempt.quizId;
    const row = byCourse.get(key) ?? { title: courseTitle ?? "اختبارات عامة", slug: null, attempts: 0, best: 0, sum: 0 };
    row.attempts += 1;
    row.best = Math.max(row.best, attempt.percent);
    row.sum += attempt.percent;
    byCourse.set(key, row);
  });
  byCourse.forEach((row) => {
    row.slug = enrolled.find((c) => c.title === row.title)?.slug ?? null;
  });

  const trend = attempts.slice(0, 8).reverse();

  return (
    <div className="space-y-5">
      {/* البطاقة الرئيسية */}
      <section className="relative overflow-hidden rounded-3xl bg-navy-900 p-5">
        <div className="grid-paper absolute inset-0 opacity-45" />
        <div className="relative flex items-center gap-4">
          <ProgressRing value={stats.averageScore} size={84} stroke={7} label="متوسطك" />
          <div className="min-w-0 flex-1">
            <p className="font-display text-base font-extrabold text-white">أداؤك العام</p>
            <p className="mt-1 text-[0.72rem] font-semibold leading-6 text-mist-300">
              {stats.quizAttempts} محاولة اختبار · نسبة الاجتياز {passRate}٪
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[0.66rem] font-bold text-gold-300">
                <IconTrophy className="h-3.5 w-3.5" />
                الأعلى {stats.bestScore}٪
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[0.66rem] font-bold text-mist-200">
                <IconQuiz className="h-3.5 w-3.5" />
                {passed} ناجح
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* مؤشرات */}
      <section className="grid grid-cols-3 gap-2.5">
        {[
          { label: "المحاولات", value: stats.quizAttempts, icon: <IconQuiz className="h-4 w-4" /> },
          { label: "الاجتياز", value: `${passRate}٪`, icon: <IconTarget className="h-4 w-4" /> },
          { label: "الشهادات", value: stats.certificates, icon: <IconTrend className="h-4 w-4" /> },
        ].map((s) => (
          <Card key={s.label} className="p-3 text-center">
            <span className="mx-auto flex h-8 w-8 items-center justify-center rounded-xl bg-navy-50 text-navy-600">{s.icon}</span>
            <p className="mt-1.5 font-display text-base font-extrabold tabular-nums text-navy-800">{s.value}</p>
            <p className="text-[0.64rem] font-bold text-mist-500">{s.label}</p>
          </Card>
        ))}
      </section>

      {/* الاتجاه */}
      {trend.length > 1 && (
        <Card className="p-4">
          <AppSectionTitle title="اتجاه درجاتك" />
          <div className="flex h-24 items-end gap-2">
            {trend.map(({ attempt }, i) => (
              <div key={attempt.id} className="flex flex-1 flex-col items-center gap-1.5">
                <span className="text-[0.58rem] font-bold tabular-nums text-mist-500">{attempt.percent}</span>
                <div
                  className="w-full rounded-t-lg transition-all"
                  style={{
                    height: `${Math.max(6, attempt.percent)}%`,
                    background: attempt.passed ? "linear-gradient(180deg,#E9C963,#C9A227)" : "linear-gradient(180deg,#9AA9BD,#74839A)",
                  }}
                  title={`محاولة ${i + 1}`}
                />
                <span className="text-[0.55rem] font-semibold text-mist-400">{i + 1}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* حسب الكورس */}
      {byCourse.size > 0 && (
        <section>
          <AppSectionTitle title="أداؤك في كل مقرر" />
          <div className="space-y-2.5">
            {[...byCourse.values()].map((row) => (
              <Card key={row.title} className="p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    {row.slug ? (
                      <Link href={`/learn/${row.slug}`} className="line-clamp-1 text-xs font-extrabold text-navy-800 transition hover:text-gold-600">
                        {row.title}
                      </Link>
                    ) : (
                      <p className="line-clamp-1 text-xs font-extrabold text-navy-800">{row.title}</p>
                    )}
                    <p className="mt-0.5 text-[0.66rem] font-semibold text-mist-500">{row.attempts} محاولة · متوسط {Math.round(row.sum / row.attempts)}٪</p>
                  </div>
                  <Badge tone={row.best >= 60 ? "success" : "warning"}>الأعلى {row.best}٪</Badge>
                </div>
                <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-mist-200">
                  <div className="h-full rounded-full bg-navy-600" style={{ width: `${row.best}%` }} />
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* السجل */}
      <section>
        <AppSectionTitle title="سجلّ المحاولات" />
        {attempts.length ? (
          <Card className="divide-y divide-mist-100 p-0">
            {attempts.slice(0, 20).map(({ attempt, quizTitle, courseTitle }) => (
              <div key={attempt.id} className="flex items-center gap-3 px-3.5 py-3">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[0.68rem] font-extrabold tabular-nums ${attempt.passed ? "bg-success-soft text-success" : "bg-danger-soft text-danger"}`}>
                  {attempt.percent}٪
                </span>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-xs font-extrabold text-navy-800">{quizTitle}</p>
                  <p className="line-clamp-1 text-[0.64rem] font-semibold text-mist-500">
                    {courseTitle ?? "—"} · {attempt.score}/{attempt.totalPoints} نقطة
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 text-[0.6rem] font-semibold text-mist-400">
                    <IconClock className="h-3 w-3" />
                    {formatDateTime(attempt.submittedAt)}
                  </p>
                </div>
                <Link href={`/quiz/${attempt.quizId}`} className="btn btn-ghost btn-sm shrink-0">مراجعة</Link>
              </div>
            ))}
          </Card>
        ) : (
          <EmptyState
            icon={<IconChart className="h-6 w-6" />}
            title="لا محاولات بعد"
            description="أكمل دروسك ثم اختبر نفسك لتظهر درجاتك هنا."
            action={<Link href="/library" className="btn btn-primary btn-sm">افتح المكتبة</Link>}
          />
        )}
      </section>
    </div>
  );
}
