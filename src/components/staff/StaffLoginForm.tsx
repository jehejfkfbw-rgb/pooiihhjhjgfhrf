"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, User, Users } from "lucide-react";
import { NovaMark } from "@/components/site/Logo";

export function StaffLoginForm({ portal }: { portal: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/staff/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: fd.get("username"),
          password: fd.get("password"),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "تعذر الدخول");
      router.replace(`${portal}/workspace`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر الدخول");
      setLoading(false);
    }
  }

  return (
    <div className="glass w-full max-w-md rounded-[2rem] p-8 sm:p-10">
      <div className="flex flex-col items-center text-center">
        <NovaMark size={50} />
        <h1 className="font-display mt-5 text-2xl font-black text-white">
          بوابة فريق نوفا كود
        </h1>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-dim">
          <Users size={13} className="text-cyan-300" />
          مخصصة لموظفي خدمة العملاء والتسويق فقط
        </p>
      </div>

      <form onSubmit={submit} className="mt-8 space-y-4">
        <label className="block">
          <span className="mb-2 flex items-center gap-2 text-xs font-bold text-ink-dim">
            <User size={14} /> اسم المستخدم
          </span>
          <input
            name="username"
            required
            autoComplete="username"
            className="field"
            dir="ltr"
            placeholder="laila"
          />
        </label>
        <label className="block">
          <span className="mb-2 flex items-center gap-2 text-xs font-bold text-ink-dim">
            <Lock size={14} /> كلمة المرور
          </span>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="field"
            dir="ltr"
            placeholder="••••••••"
          />
        </label>

        {error && (
          <p className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-center text-sm font-bold text-rose-300">
            {error}
          </p>
        )}

        <button
          disabled={loading}
          className="btn-primary flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-display text-sm font-black text-white disabled:opacity-60"
        >
          {loading ? <Loader2 size={17} className="animate-spin" /> : <Users size={16} />}
          {loading ? "جارٍ التحقق..." : "دخول بوابة الموظفين"}
        </button>
      </form>

      <p className="mt-6 text-center text-[11px] leading-relaxed text-ink-dim">
        هذه البوابة للعمل المُسند من الإدارة فقط. لا توجد بها أي صلاحيات اعتماد أو تعديل أسعار.
      </p>
    </div>
  );
}
