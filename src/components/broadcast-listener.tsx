"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/client-api";
import { IconClose, IconLamp } from "@/components/icons";
import { cn } from "@/lib/utils";

type ActiveBroadcast = {
  id: string;
  message: string;
  tone: "info" | "gold" | "success" | "urgent";
  durationSeconds: number;
  createdByName: string | null;
} | null;

const SEEN_KEY = "nebras.broadcast.seen";
const POLL_MS = 6000;

function readSeen(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SEEN_KEY);
    const list = raw ? (JSON.parse(raw) as string[]) : [];
    return Array.isArray(list) ? list.slice(-30) : [];
  } catch {
    return [];
  }
}

function pushSeen(id: string) {
  if (typeof window === "undefined") return;
  try {
    const next = [...readSeen().filter((x) => x !== id), id].slice(-30);
    window.localStorage.setItem(SEEN_KEY, JSON.stringify(next));
  } catch {
    /* التخزين المحلي غير متاح — لا يؤثر على العرض */
  }
}

const TONE_STYLE: Record<string, string> = {
  info: "border-navy-300 bg-navy-800 text-white",
  gold: "border-gold-300 bg-gradient-to-l from-navy-800 to-navy-900 text-white",
  success: "border-success/40 bg-success text-white",
  urgent: "border-danger/40 bg-danger text-white",
};

const ACCENT: Record<string, string> = {
  info: "bg-navy-300",
  gold: "bg-gold-400",
  success: "bg-white",
  urgent: "bg-white",
};

/**
 * مُستمع البثّ الفوري: يعمل في كل صفحات المنصة.
 * يسأل الخادم كل بضع ثوانٍ عن بثّ حيّ، ويعرضه مرة واحدة لكل مستخدم
 * لمدة `durationSeconds` (الافتراضي ١٠ ثوانٍ) ثم يُخفيه تلقائيًا.
 */
export function BroadcastListener() {
  const [active, setActive] = useState<ActiveBroadcast>(null);
  const [remaining, setRemaining] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((broadcast: NonNullable<ActiveBroadcast>) => {
    setActive(broadcast);
    setVisible(true);
    setRemaining(broadcast.durationSeconds);
    pushSeen(broadcast.id);

    // تسجيل المشاهدة مرة واحدة (لا يكسر العرض إن فشل)
    api(`/api/broadcasts/${broadcast.id}/view`, { method: "POST" }).catch(() => undefined);

    const startedAt = Date.now();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const left = Math.max(0, broadcast.durationSeconds - (Date.now() - startedAt) / 1000);
      setRemaining(left);
      if (left <= 0 && timerRef.current) clearInterval(timerRef.current);
    }, 100);

    if (hideRef.current) clearTimeout(hideRef.current);
    hideRef.current = setTimeout(() => {
      setVisible(false);
      setTimeout(() => setActive(null), 320);
    }, broadcast.durationSeconds * 1000);
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (hideRef.current) clearTimeout(hideRef.current);
    setTimeout(() => setActive(null), 320);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const data = await api<{ broadcast: NonNullable<ActiveBroadcast> }>("/api/broadcasts");
        if (cancelled) return;
        const broadcast = data.broadcast;
        if (broadcast && !readSeen().includes(broadcast.id)) show(broadcast);
      } catch {
        /* تجاهل أخطاء الشبكة — المحاولة التالية بعد قليل */
      }
    }

    void poll();
    const interval = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
      if (timerRef.current) clearInterval(timerRef.current);
      if (hideRef.current) clearTimeout(hideRef.current);
    };
  }, [show]);

  if (!active) return null;
  const total = active.durationSeconds || 10;
  const percent = Math.max(0, Math.min(100, (remaining / total) * 100));

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 top-3 z-[120] flex justify-center px-3 transition-all duration-300 sm:top-5",
        visible ? "translate-y-0 opacity-100" : "-translate-y-6 opacity-0",
      )}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className={cn("pointer-events-auto w-full max-w-2xl overflow-hidden rounded-2xl border shadow-lift", TONE_STYLE[active.tone] ?? TONE_STYLE.gold)}>
        <div className="flex items-start gap-3 px-4 py-3.5 sm:px-5">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15">
            <IconLamp className="h-5 w-5" />
          </span>

          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-2 text-[0.66rem] font-bold uppercase tracking-[0.14em] text-white/70">
              بثّ فوري من إدارة نبراس
              {active.createdByName && <span className="normal-case tracking-normal">· {active.createdByName}</span>}
            </p>
            <p className="mt-1 font-display text-[0.98rem] font-extrabold leading-7 sm:text-[1.05rem]">{active.message}</p>
          </div>

          <div className="flex shrink-0 flex-col items-center gap-1">
            <span className="font-display text-sm font-extrabold tabular-nums text-white/85">{Math.ceil(remaining)}ث</span>
            <button
              onClick={dismiss}
              className="rounded-lg p-1.5 text-white/70 transition hover:bg-white/15 hover:text-white"
              aria-label="إغلاق البثّ"
            >
              <IconClose className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="h-1 w-full bg-black/15">
          <div
            className={cn("h-full transition-[width] duration-100 ease-linear", ACCENT[active.tone] ?? ACCENT.gold)}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
