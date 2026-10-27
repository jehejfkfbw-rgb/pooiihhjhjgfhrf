import type { Metadata } from "next";
import Link from "next/link";
import { getUserStats, listStages } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Avatar, Badge, Card } from "@/components/ui";
import { AppSectionTitle, LogoutButton } from "@/components/app-shell";
import { ProfileForm } from "@/components/profile-form";
import { CountryFlag } from "@/components/country-flag";
import { getCountry, COUNTRY_LIST } from "@/lib/countries";
import {
  IconBell, IconBookOpen, IconCertificate, IconChart, IconChevronLeft, IconClock,
  IconLayers, IconShield, IconTarget,
} from "@/components/icons";
import { formatDateTime, ROLE_LABEL } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "حسابي" };

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/profile");

  const [stageRows, stats] = await Promise.all([listStages(true), getUserStats(user.id)]);
  const stage = stageRows.find((s) => s.id === user.stageId);
  const country = getCountry(user.country);

  const rows = [
    { href: "/my-courses", label: "كورساتي", value: `${stats.enrolled} كورس`, icon: <IconBookOpen className="h-4 w-4" /> },
    { href: "/grades", label: "الدرجات والاختبارات", value: `متوسط ${stats.averageScore}٪`, icon: <IconChart className="h-4 w-4" /> },
    { href: "/certificates", label: "شهاداتي", value: `${stats.certificates} شهادة`, icon: <IconCertificate className="h-4 w-4" /> },
    { href: "/library", label: "مكتبة الكورسات", value: "تصفّح", icon: <IconLayers className="h-4 w-4" /> },
    { href: "/contact", label: "الدعم الفني", value: "راسلنا", icon: <IconBell className="h-4 w-4" /> },
    { href: "/about", label: "عن نبراس", value: "", icon: <IconShield className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-5">
      {/* بطاقة الحساب */}
      <section className="relative overflow-hidden rounded-3xl bg-navy-900 p-5">
        <div className="grid-paper absolute inset-0 opacity-45" />
        <div className="relative flex items-center gap-3.5">
          <Avatar name={user.fullName} src={user.avatarUrl} size={60} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-base font-extrabold text-white">{user.fullName}</p>
            <p className="truncate text-[0.7rem] font-semibold text-mist-400" dir="ltr">{user.email}</p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Badge tone="gold">{ROLE_LABEL[user.role] ?? user.role}</Badge>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2 py-0.5 text-[0.64rem] font-bold text-white/90">
                <CountryFlag code={country.code} className="h-2.5 w-4" />
                {country.nameAr}
              </span>
              {stage && <span className="rounded-full bg-white/10 px-2 py-0.5 text-[0.64rem] font-bold text-white/85">{stage.name}</span>}
            </div>
          </div>
        </div>

        <dl className="relative mt-4 grid grid-cols-2 gap-2">
          {[
            { l: "عضو منذ", v: formatDateTime(user.createdAt), icon: <IconClock className="h-3.5 w-3.5" /> },
            { l: "آخر دخول", v: user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "—", icon: <IconTarget className="h-3.5 w-3.5" /> },
            { l: "الجوال", v: user.phone ?? "غير مضاف", icon: <IconShield className="h-3.5 w-3.5" />, ltr: true },
            { l: "العملة", v: `${country.currencyAr} (${country.currency})`, icon: <IconChart className="h-3.5 w-3.5" /> },
          ].map((item) => (
            <div key={item.l} className="rounded-xl bg-white/8 px-3 py-2.5">
              <dt className="flex items-center gap-1.5 text-[0.62rem] font-bold text-mist-400">
                <span className="text-gold-400">{item.icon}</span>
                {item.l}
              </dt>
              <dd className="mt-1 truncate text-[0.7rem] font-extrabold text-white" dir={item.ltr ? "ltr" : undefined}>{item.v}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* مؤشرات سريعة */}
      <section className="grid grid-cols-4 gap-2">
        {[
          { l: "دروس", v: stats.completedLessons },
          { l: "اختبارات", v: stats.quizAttempts },
          { l: "دقائق", v: stats.studyMinutes },
          { l: "شهادات", v: stats.certificates },
        ].map((s) => (
          <Card key={s.l} className="p-2.5 text-center">
            <p className="font-display text-base font-extrabold tabular-nums text-navy-800">{s.v}</p>
            <p className="text-[0.6rem] font-bold text-mist-500">{s.l}</p>
          </Card>
        ))}
      </section>

      {/* روابط التطبيق */}
      <section>
        <AppSectionTitle title="أقسام التطبيق" />
        <Card className="divide-y divide-mist-100 p-0">
          {rows.map((row) => (
            <Link key={row.href} href={row.href} className="flex items-center gap-3 px-3.5 py-3 transition hover:bg-navy-50">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-600">{row.icon}</span>
              <span className="min-w-0 flex-1 text-xs font-extrabold text-navy-800">{row.label}</span>
              {row.value && <span className="shrink-0 text-[0.66rem] font-bold text-mist-500">{row.value}</span>}
              <IconChevronLeft className="h-4 w-4 shrink-0 text-mist-300" />
            </Link>
          ))}
        </Card>
      </section>

      {/* الدول المدعومة */}
      <section>
        <AppSectionTitle title="الدول المدعومة" />
        <Card className="grid grid-cols-4 gap-2 p-3">
          {COUNTRY_LIST.map((c) => (
            <div key={c.code} className={`flex flex-col items-center gap-1.5 rounded-xl px-1 py-2 ${c.code === country.code ? "bg-gold-50 ring-1 ring-gold-300" : "bg-mist-50"}`}>
              <CountryFlag code={c.code} className="h-4 w-6" />
              <span className="text-[0.6rem] font-extrabold text-navy-800">{c.nameAr}</span>
              <span className="text-[0.55rem] font-semibold text-mist-500" dir="ltr">{c.dial}</span>
            </div>
          ))}
        </Card>
      </section>

      {/* تحرير البيانات */}
      <section>
        <AppSectionTitle title="تعديل البيانات والأمان" />
        <ProfileForm
          user={{
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            city: user.city,
            bio: user.bio,
            avatarUrl: user.avatarUrl,
            stageId: user.stageId,
            role: user.role,
            country: user.country,
          }}
          stages={stageRows.map((s) => ({ id: s.id, name: s.name }))}
        />
      </section>

      <section className="space-y-2.5 pb-2">
        <LogoutButton />
        {user.role !== "student" && (
          <Link href="/admin" className="btn btn-gold w-full">
            <IconChart className="h-4 w-4" />
            لوحة الإدارة
          </Link>
        )}
        <p className="text-center text-[0.62rem] font-semibold text-mist-400">
          نبراس · الإصدار ١٫٠ · {country.nameAr}
        </p>
      </section>
    </div>
  );
}
