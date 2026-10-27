import type { Metadata } from "next";
import Link from "next/link";
import { and, count, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { quizAttempts, quizzes } from "@/db/schema";
import { getUserAttempts, getUserCourses, getUserStats, listAnnouncements, stagesWithCounts } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Badge, Card, ProgressBar } from "@/components/ui";
import { AppSectionTitle, HorizontalScroller, ProgressRing } from "@/components/app-shell";
import { CourseCover } from "@/components/course-cover";
import { getCountry } from "@/lib/countries";
import {
  IconBell, IconBookOpen, IconCertificate, IconChart, IconClock, IconLayers,
  IconPlay, IconQuiz, IconTarget, IconTrophy, StageIcon,
} from "@/components/icons";
import { formatDate, percentOf } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "الرئيسية" };

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard");
  const country = getCountry(user.country);

  const [enrolled, stats, attempts, news, stageList] = await Promise.all([
    getUserCourses(user.id),
    getUserStats(user.id),
    getUserAttempts(user.id, 4),
    listAnnouncements(true, 3),
    stagesWithCounts(),
  ]);

  const courseIds = enrolled.map((c) => c.id);
  const continueCourses = enrolled.filter((c) => c.progress > 0 && c.progress < 100);
  const notStarted = enrolled.filter((c) => c.progress === 0);
  const completed = enrolled.filter((c) => c.progress >= 100);
  const nextUp = continueCourses[0] ?? notStarted[0] ?? enrolled[0] ?? null;

  const overall = enrolled.length
    ? Math.round(enrolled.reduce((s, c) => s + c.progress, 0) / enrolled.length)
    : 0;

  const pendingQuizzes = courseIds.length
    ? await db
        .select({
          quiz: quizzes,
          attemptsUsed: sql<number>`(select count(*)::int from ${quizAttempts} where ${quizAttempts.quizId} = ${quizzes.id} and ${quizAttempts.userId} = ${user.id})`,
        })
        .from(quizzes)
        .where(and(inArray(quizzes.courseId, courseIds), eq(quizzes.isPublished, true)))
        .orderBy(desc(quizzes.sortOrder))
        .limit(3)
    : [];

  // سلسلة التعلّم: أيام متتالية أكمل فيها الطالب درسًا
  const activeDays = await db
    .select({ v: count() })
    .from(sql`(select distinct date(coalesce(completed_at, updated_at)) as d from lesson_progress where user_id = ${user.id} and completed = true and coalesce(completed_at, updated_at) >= now() - interval '30 days') t`);
  const streak = activeDays[0]?.v ?? 0;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "صباح الخير" : hour < 17 ? "نهارك سعيد" : "مساء الخير";

  const quickActions = [
    { href: "/library", label: "المكتبة", icon: IconLayers, tone: "bg-navy-700 text-gold-300" },
    { href: "/my-courses", label: "كورساتي", icon: IconBookOpen, tone: "bg-gold-500 text-navy-900" },
    { href: "/grades", label: "درجاتي", icon: IconTarget, tone: "bg-success text-white" },
    { href: "/certificates", label: "شهاداتي", icon: IconCertificate, tone: "bg-navy-100 text-navy-700" },
  ];

  return (
    <div className="space-y-6">
      {/* بطاقة الترحيب والتقدّم */}
      <section className="relative overflow-hidden rounded-3xl bg-navy-900 p-5">
        <div className="grid-paper absolute inset-0 opacity-50" />
        <div
          className="absolute -left-10 -top-10 h-40 w-40 rounded-full opacity-25 blur-2xl"
          style={{ background: `radial-gradient(circle, ${country.accent ?? "#C9A227"}, transparent 70%)` }}
        />
        <div className="relative">
          <p className="text-[0.7rem] font-bold text-gold-400">{greeting} 👋</p>
          <h1 className="mt-1 font-display text-lg font-extrabold text-white">{user.fullName}</h1>

          <div className="mt-4 flex items-center gap-4">
            <ProgressRing value={overall} size={72} label="إنجازك" />
            <div className="min-w-0 flex-1">
              <p className="text-[0.72rem] font-semibold leading-6 text-mist-300">
                {enrolled.length
                  ? `${enrolled.length} كورس · ${stats.completedLessons} درس مكتمل · ${completed.length} شهادة`
                  : "ابدأ بتسجيل أول كورس من المكتبة"}
              </p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[0.66rem] font-bold text-gold-300">
                  <IconTrophy className="h-3.5 w-3.5" />
                  سلسلة {streak} يوم
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[0.66rem] font-bold text-mist-200">
                  <IconClock className="h-3.5 w-3.5" />
                  {stats.studyMinutes} دقيقة دراسة
                </span>
              </div>
            </div>
          </div>

          {nextUp && (
            <Link
              href={`/learn/${nextUp.slug}`}
              className="mt-4 flex items-center gap-3 rounded-2xl bg-white/10 p-3 transition hover:bg-white/15"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-500 text-navy-900">
                <IconPlay className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-extrabold text-white">
                  {nextUp.progress > 0 ? "واصل من حيث توقفت" : "ابدأ كورسك"}
                </span>
                <span className="block truncate text-[0.7rem] font-semibold text-mist-300">{nextUp.title}</span>
              </span>
              <span className="shrink-0 text-[0.7rem] font-extrabold tabular-nums text-gold-300">{nextUp.progress}٪</span>
            </Link>
          )}
        </div>
      </section>

      {/* إجراءات سريعة */}
      <section className="grid grid-cols-4 gap-2.5">
        {quickActions.map((a) => (
          <Link key={a.href} href={a.href} className="flex flex-col items-center gap-1.5">
            <span className={`flex h-12 w-full items-center justify-center rounded-2xl ${a.tone} shadow-card transition active:scale-95`}>
              <a.icon className="h-5 w-5" />
            </span>
            <span className="text-[0.68rem] font-bold text-mist-600">{a.label}</span>
          </Link>
        ))}
      </section>

      {/* المؤشرات */}
      <section className="grid grid-cols-2 gap-2.5">
        {[
          { label: "متوسط الدرجات", value: `${stats.averageScore}٪`, icon: <IconChart className="h-4 w-4" />, tone: stats.averageScore >= 60 ? "text-success" : "text-warning" },
          { label: "دروس مكتملة", value: stats.completedLessons, icon: <IconTarget className="h-4 w-4" />, tone: "text-navy-700" },
          { label: "محاولات الاختبار", value: stats.quizAttempts, icon: <IconQuiz className="h-4 w-4" />, tone: "text-navy-700" },
          { label: "الشهادات", value: stats.certificates, icon: <IconCertificate className="h-4 w-4" />, tone: "text-gold-600" },
        ].map((s) => (
          <Card key={s.label} className="flex items-center gap-3 p-3.5">
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-mist-50 ${s.tone}`}>{s.icon}</span>
            <div className="min-w-0">
              <p className="font-display text-base font-extrabold tabular-nums text-navy-800">{s.value}</p>
              <p className="truncate text-[0.66rem] font-semibold text-mist-500">{s.label}</p>
            </div>
          </Card>
        ))}
      </section>

      {/* واصل التعلّم */}
      {enrolled.length > 0 && (
        <section>
          <AppSectionTitle title="واصل التعلّم" action="الكل" href="/my-courses" />
          <HorizontalScroller>
            {enrolled.slice(0, 6).map((c) => (
              <Link key={c.id} href={`/learn/${c.slug}`} className="w-56 shrink-0 snap-start overflow-hidden rounded-2xl border border-mist-200 bg-white shadow-card transition active:scale-[0.98]">
                <CourseCover seed={c.slug} accent={c.stage?.accent} compact />
                <div className="p-3">
                  <p className="line-clamp-1 text-xs font-extrabold text-navy-800">{c.title}</p>
                  <p className="mt-0.5 text-[0.66rem] font-semibold text-mist-500">{c.completedLessons}/{c.totalLessons} درس · {c.stage?.name}</p>
                  <div className="mt-2">
                    <ProgressBar value={c.progress} tone={c.progress >= 100 ? "success" : "navy"} />
                  </div>
                </div>
              </Link>
            ))}
          </HorizontalScroller>
        </section>
      )}

      {/* المراحل */}
      <section>
        <AppSectionTitle title="تصفّح حسب المرحلة" action="المكتبة" href="/library" />
        <HorizontalScroller>
          {stageList.map((stage) => (
            <Link
              key={stage.id}
              href={`/library?stage=${stage.id}`}
              className="flex w-28 shrink-0 snap-start flex-col items-center gap-2 rounded-2xl border border-mist-200 bg-white p-3 text-center shadow-card transition active:scale-95"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl text-white" style={{ background: stage.accent ?? "#1B3A6B" }}>
                <StageIcon iconKey={stage.iconKey} className="h-5 w-5" />
              </span>
              <span className="line-clamp-2 text-[0.68rem] font-extrabold leading-5 text-navy-800">{stage.name}</span>
              <Badge tone="muted">{stage.courseCount} كورس</Badge>
            </Link>
          ))}
        </HorizontalScroller>
      </section>

      {/* اختبارات مقترحة */}
      {pendingQuizzes.length > 0 && (
        <section>
          <AppSectionTitle title="اختبارات بانتظارك" action="درجاتي" href="/grades" />
          <div className="space-y-2.5">
            {pendingQuizzes.map(({ quiz, attemptsUsed }) => {
              const left = Math.max(0, quiz.attemptsAllowed - attemptsUsed);
              return (
                <Card key={quiz.id} className="flex items-center gap-3 p-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-100 text-gold-700">
                    <IconQuiz className="h-4.5 w-4.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-extrabold text-navy-800">{quiz.title}</p>
                    <p className="mt-0.5 text-[0.66rem] font-semibold text-mist-500">
                      {quiz.timeLimitMinutes} دقيقة · النجاح {quiz.passingPercent}٪ · {attemptsUsed > 0 ? `${attemptsUsed} محاولة` : "لم يُؤدَّ بعد"}
                    </p>
                  </div>
                  <Link href={`/quiz/${quiz.id}`} className={left > 0 ? "btn btn-primary btn-sm shrink-0" : "btn btn-outline btn-sm shrink-0 opacity-60"}>
                    {left > 0 ? "ابدأ" : "انتهت"}
                  </Link>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* آخر النتائج */}
      {attempts.length > 0 && (
        <section>
          <AppSectionTitle title="آخر نتائجك" action="الكل" href="/grades" />
          <Card className="divide-y divide-mist-100 p-0">
            {attempts.map(({ attempt, quizTitle, courseTitle }) => (
              <div key={attempt.id} className="flex items-center gap-3 px-3.5 py-3">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[0.68rem] font-extrabold ${attempt.passed ? "bg-success-soft text-success" : "bg-danger-soft text-danger"}`}>
                  {attempt.percent}٪
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-extrabold text-navy-800">{quizTitle}</p>
                  <p className="truncate text-[0.66rem] font-semibold text-mist-500">{courseTitle ?? "—"} · {formatDate(attempt.submittedAt)}</p>
                </div>
                <Badge tone={attempt.passed ? "success" : "danger"}>{attempt.passed ? "ناجح" : "مراجعة"}</Badge>
              </div>
            ))}
          </Card>
        </section>
      )}

      {/* إعلانات */}
      {news.length > 0 && (
        <section>
          <AppSectionTitle title="من المنصة" />
          <div className="space-y-2.5">
            {news.map(({ announcement }) => (
              <Card key={announcement.id} className="p-3.5">
                <p className="flex items-center gap-2 text-xs font-extrabold text-navy-800">
                  <IconBell className="h-4 w-4 shrink-0 text-gold-600" />
                  {announcement.title}
                </p>
                <p className="mt-1.5 line-clamp-2 text-[0.72rem] leading-6 text-mist-600">{announcement.body}</p>
                <p className="mt-1.5 text-[0.62rem] font-semibold text-mist-400">{formatDate(announcement.publishedAt)}</p>
              </Card>
            ))}
          </div>
        </section>
      )}

      {enrolled.length === 0 && (
        <Card className="p-5 text-center">
          <p className="font-display text-sm font-extrabold text-navy-800">لم تسجّل في أي كورس بعد</p>
          <p className="mt-1.5 text-xs leading-6 text-mist-600">اختر مرحلتك من المكتبة وابدأ أول درس خلال دقيقة.</p>
          <Link href="/library" className="btn btn-primary btn-sm mt-4">افتح المكتبة</Link>
        </Card>
      )}

      <p className="pb-2 text-center text-[0.62rem] font-semibold text-mist-400">
        نبراس · {country.nameAr} · نسبة الإنجاز الكلية {percentOf(overall, 100)}٪
      </p>
    </div>
  );
}
