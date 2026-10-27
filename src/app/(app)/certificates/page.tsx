import type { Metadata } from "next";
import Link from "next/link";
import { getUserCertificates, getUserCourses } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Badge, Card, EmptyState } from "@/components/ui";
import { AppSectionTitle } from "@/components/app-shell";
import { CertificateVerifier } from "@/components/certificate-verifier";
import { PrintButton } from "@/components/print-button";
import { NebrasMark } from "@/components/logo";
import { IconCertificate, IconCheckCircle, IconTrophy } from "@/components/icons";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "شهاداتي" };

export default async function CertificatesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/certificates");

  const [certs, enrolled] = await Promise.all([getUserCertificates(user.id), getUserCourses(user.id)]);
  const inProgress = enrolled.filter((c) => c.progress > 0 && c.progress < 100);

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-3xl bg-navy-900 p-5">
        <div className="grid-paper absolute inset-0 opacity-45" />
        <div className="relative flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gold-500/15 text-gold-300">
            <IconTrophy className="h-6 w-6" />
          </span>
          <div>
            <p className="font-display text-base font-extrabold text-white">شهاداتي</p>
            <p className="mt-0.5 text-[0.72rem] font-semibold leading-6 text-mist-300">
              {certs.length} شهادة صادرة · تُمنح تلقائيًا عند إتمام ١٠٠٪ من دروس الكورس
            </p>
          </div>
        </div>
      </section>

      {certs.length ? (
        <section className="space-y-3">
          <AppSectionTitle title="الشهادات الصادرة" />
          {certs.map(({ certificate, course, stage }) => (
            <article key={certificate.id} className="overflow-hidden rounded-2xl border-2 border-gold-300 bg-white p-1 shadow-card">
              <div className="rounded-xl border border-navy-200 bg-gradient-to-bl from-white via-mist-50 to-navy-50 px-4 py-5 text-center">
                <div className="flex items-center justify-center gap-2.5">
                  <NebrasMark className="h-9 w-9" />
                  <div className="text-right">
                    <p className="font-display text-xs font-extrabold text-navy-800">منصة نبراس التعليمية</p>
                    <p className="text-[0.55rem] font-bold tracking-[0.22em] text-gold-600" dir="ltr">NEBRAS LEARNING</p>
                  </div>
                </div>

                <p className="mt-4 font-display text-sm font-extrabold text-gold-600">شهادة إتمام</p>
                <p className="mt-2 text-[0.7rem] text-mist-600">تشهد منصة نبراس بأن الطالب/ة</p>
                <p className="mt-1 font-display text-base font-extrabold text-navy-800">{user.fullName}</p>
                <p className="mt-2 text-[0.7rem] text-mist-600">أتمّ بنجاح كورس</p>
                <p className="mt-1 font-display text-sm font-extrabold leading-6 text-navy-700">«{course.title}»</p>
                <p className="mt-0.5 text-[0.62rem] font-semibold text-mist-500">{stage.name}</p>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[
                    { l: "التقدير", v: `${certificate.grade}٪` },
                    { l: "الإصدار", v: formatDate(certificate.issuedAt) },
                    { l: "الرمز", v: certificate.code, ltr: true },
                  ].map((cell) => (
                    <div key={cell.l} className="rounded-lg bg-white/85 px-2 py-2 ring-1 ring-mist-200">
                      <p className="text-[0.55rem] font-bold text-mist-500">{cell.l}</p>
                      <p className="mt-0.5 font-display text-[0.62rem] font-extrabold leading-4 text-navy-800" dir={cell.ltr ? "ltr" : undefined}>
                        {cell.v}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-center gap-2 no-print">
                  <PrintButton label="طباعة / PDF" />
                  <Link href={`/learn/${course.slug}`} className="btn btn-ghost btn-sm">مراجعة</Link>
                </div>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <EmptyState
          icon={<IconCertificate className="h-6 w-6" />}
          title="لا شهادات بعد"
          description="أكمل كل دروس أحد كورساتك لتُصدر شهادتك تلقائيًا مع رمز تحقّق."
          action={<Link href="/my-courses" className="btn btn-primary btn-sm">كورساتي</Link>}
        />
      )}

      <CertificateVerifier />

      {inProgress.length > 0 && (
        <section>
          <AppSectionTitle title="على بُعد خطوات من شهادة" action="كورساتي" href="/my-courses" />
          <Card className="divide-y divide-mist-100 p-0">
            {inProgress.slice(0, 4).map((c) => (
              <Link key={c.id} href={`/learn/${c.slug}`} className="flex items-center gap-3 px-3.5 py-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold-100 text-gold-700">
                  <IconCheckCircle className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1 truncate text-xs font-extrabold text-navy-800">{c.title}</span>
                <Badge tone="gold">{c.progress}٪</Badge>
              </Link>
            ))}
          </Card>
        </section>
      )}
    </div>
  );
}
