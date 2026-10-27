"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { NebrasMark } from "@/components/logo";
import { CountryFlag } from "@/components/country-flag";
import { getCountry } from "@/lib/countries";
import { api, errorMessage } from "@/lib/client-api";
import { useToast } from "@/components/toast";
import { Spinner } from "@/components/ui";
import {
  IconBookOpen, IconChart, IconGrid, IconLayers, IconLogout, IconTarget, IconUser,
} from "@/components/icons";

export type ShellUser = {
  id: string; fullName: string; email: string; role: string;
  avatarUrl: string | null; country?: string | null; streak?: number;
};

const TABS = [
  { href: "/dashboard", label: "الرئيسية", icon: IconGrid },
  { href: "/library", label: "المكتبة", icon: IconLayers },
  { href: "/my-courses", label: "كورساتي", icon: IconBookOpen },
  { href: "/grades", label: "درجاتي", icon: IconTarget },
  { href: "/profile", label: "حسابي", icon: IconUser },
];

const TITLES: Array<{ match: (p: string) => boolean; title: string }> = [
  { match: (p) => p.startsWith("/library"), title: "مكتبة الكورسات" },
  { match: (p) => p.startsWith("/my-courses"), title: "كورساتي" },
  { match: (p) => p.startsWith("/grades"), title: "درجاتي" },
  { match: (p) => p.startsWith("/certificates"), title: "شهاداتي" },
  { match: (p) => p.startsWith("/profile"), title: "حسابي" },
  { match: (p) => p.startsWith("/quiz"), title: "اختبار" },
  { match: (p) => p.startsWith("/learn"), title: "الدرس" },
  { match: (p) => p.startsWith("/dashboard"), title: "الرئيسية" },
];

/**
 * هيكل التطبيق (App Shell):
 * شريط علوي + محتوى قابل للتمرير + شريط تبويبات سفلي،
 * بعرض عمود واحد على الجوال، وداخل إطار جهاز على الشاشات الكبيرة.
 */
export function AppShell({ user, children }: { user: ShellUser; children: ReactNode }) {
  const pathname = usePathname();
  const country = getCountry(user.country);
  const title = TITLES.find((t) => t.match(pathname))?.title ?? "نبراس";
  const hideTabs = pathname.startsWith("/quiz");

  return (
    <div className="min-h-screen bg-mist-50 lg:flex lg:items-center lg:justify-center lg:bg-navy-950 lg:p-6">
      {/* خلفية زخرفية على الشاشات الكبيرة */}
      <div className="pointer-events-none fixed inset-0 hidden lg:block">
        <div className="grid-paper absolute inset-0 opacity-30" />
        <div className="absolute left-1/4 top-10 h-72 w-72 rounded-full opacity-20 blur-3xl" style={{ background: "radial-gradient(circle,#C9A227,transparent 70%)" }} />
        <div className="absolute bottom-10 right-1/4 h-80 w-80 rounded-full opacity-25 blur-3xl" style={{ background: "radial-gradient(circle,#35639F,transparent 70%)" }} />
      </div>

      <div
        className={cn(
          "relative mx-auto flex min-h-screen w-full max-w-[30rem] flex-col bg-mist-50",
          "lg:my-4 lg:h-[54rem] lg:min-h-0 lg:overflow-hidden lg:rounded-[2.25rem] lg:shadow-[0_50px_100px_-30px_rgba(0,0,0,0.9)] lg:ring-8 lg:ring-navy-900",
        )}
      >
        {/* الشريط العلوي */}
        <header className="sticky top-0 z-30 border-b border-mist-200 bg-white/92 backdrop-blur-md">
          <div className="flex items-center gap-2.5 px-4 py-2.5">
            <Link href="/dashboard" className="flex items-center gap-2" aria-label="نبراس">
              <NebrasMark className="h-8 w-8" />
            </Link>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-[0.95rem] font-extrabold leading-tight text-navy-800">{title}</p>
              <p className="flex items-center gap-1.5 truncate text-[0.66rem] font-semibold text-mist-500">
                <CountryFlag code={country.code} className="h-2.5 w-4" />
                {country.nameAr} · {country.currencyAr}
              </p>
            </div>

            {user.role !== "student" && (
              <Link href="/admin" className="rounded-full bg-gold-100 p-2 text-gold-700 transition hover:bg-gold-200" aria-label="لوحة الإدارة" title="لوحة الإدارة">
                <IconChart className="h-4 w-4" />
              </Link>
            )}
            <Link href="/profile" className="flex items-center gap-2 rounded-full border border-mist-200 py-1 pl-2.5 pr-1 transition hover:border-navy-300" aria-label="حسابي">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarUrl} alt={user.fullName} className="h-6 w-6 rounded-full object-cover" />
              ) : (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-navy-700 text-[0.6rem] font-extrabold text-gold-200">
                  {user.fullName.trim().slice(0, 1)}
                </span>
              )}
              <span className="hidden text-xs font-bold text-navy-800 xs:inline">{user.fullName.split(" ")[0]}</span>
            </Link>
          </div>
        </header>

        {/* المحتوى */}
        <main className={cn("flex-1 px-4 pt-4 lg:overflow-y-auto", hideTabs ? "pb-6" : "pb-28")}>{children}</main>

        {/* شريط التبويبات السفلي */}
        {!hideTabs && (
          <nav
            className="sticky bottom-0 z-30 border-t border-mist-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:static"
            aria-label="تبويبات التطبيق"
          >
            <ul className="flex items-stretch">
              {TABS.map((tab) => {
                const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
                return (
                  <li key={tab.href} className="flex-1">
                    <Link
                      href={tab.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative flex flex-col items-center gap-1 py-2.5 text-[0.66rem] font-bold transition",
                        active ? "text-navy-800" : "text-mist-400 hover:text-navy-600",
                      )}
                    >
                      {active && <span className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-gold-500" />}
                      <tab.icon className={cn("h-5 w-5 transition", active && "scale-110 text-navy-700")} />
                      {tab.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}
      </div>
    </div>
  );
}

/** زر تسجيل الخروج — يُستخدم داخل شاشة الحساب */
export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    try {
      await api("/api/auth/logout", { method: "POST" });
      toast.push("تم تسجيل الخروج", "info");
      router.push("/");
      router.refresh();
    } catch (err) {
      toast.push(errorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button onClick={logout} disabled={busy} className={cn("btn btn-outline w-full", className)}>
      {busy ? <Spinner /> : <IconLogout className="h-4 w-4" />}
      {busy ? "جارٍ الخروج…" : "تسجيل الخروج"}
    </button>
  );
}

/** حلقة تقدّم دائمية بنمط التطبيقات */
export function ProgressRing({ value, size = 64, stroke = 6, label }: { value: number; size?: number; stroke?: number; label?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E9C963" strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={`${(v / 100) * c} ${c}`} className="transition-all duration-700"
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center">
        <b className="font-display text-sm font-extrabold tabular-nums text-white">{v}٪</b>
        {label && <span className="text-[0.55rem] font-bold text-white/70">{label}</span>}
      </span>
    </div>
  );
}

/** شريط تمرير أفقي بنمط التطبيقات (قصص/بطاقات) */
export function HorizontalScroller({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden", className)}>
      {children}
    </div>
  );
}

export function AppSectionTitle({ title, action, href }: { title: string; action?: string; href?: string }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2 className="font-display text-[0.95rem] font-extrabold text-navy-800">{title}</h2>
      {action && href && (
        <Link href={href} className="text-[0.7rem] font-bold text-navy-600 transition hover:text-gold-600">{action}</Link>
      )}
    </div>
  );
}
