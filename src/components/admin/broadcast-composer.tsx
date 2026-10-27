"use client";

import { useCallback, useEffect, useState } from "react";
import { api, errorMessage } from "@/lib/client-api";
import { useToast } from "@/components/toast";
import { Badge, Button, Card, Spinner } from "@/components/ui";
import { SelectField, TextArea } from "@/components/client-ui";
import { BroadcastListener } from "@/components/broadcast-listener";
import { IconBell, IconCheckCircle, IconClose, IconLamp, IconTrend } from "@/components/icons";
import { cn } from "@/lib/utils";

type Live = { id: string; message: string; tone: string; durationSeconds: number; createdByName: string | null } | null;

const TONES = [
  { value: "gold", label: "ذهبي — إعلانات المنصة" },
  { value: "info", label: "أزرق — معلومة عامة" },
  { value: "success", label: "أخضر — خبر سار" },
  { value: "urgent", label: "أحمر — تنبيه عاجل" },
];

const PREVIEW_BG: Record<string, string> = {
  gold: "bg-gradient-to-l from-navy-800 to-navy-900 text-white",
  info: "bg-navy-800 text-white",
  success: "bg-success text-white",
  urgent: "bg-danger text-white",
};

/** بطاقة البثّ الفوري: يكتب المدير أي رسالة فتظهر لكل المستخدمين لمدة محدّدة (افتراضيًا ١٠ ثوانٍ) */
export function BroadcastComposer() {
  const toast = useToast();
  const [message, setMessage] = useState("ونبدأ العام الدراسي الجديد 2027/2028 🎓");
  const [tone, setTone] = useState("gold");
  const [duration, setDuration] = useState(10);
  const [window_, setWindow] = useState(15);
  const [busy, setBusy] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [live, setLive] = useState<Live>(null);
  const [preview, setPreview] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const data = await api<{ broadcast: Live }>("/api/broadcasts");
      setLive(data.broadcast);
    } catch {
      setLive(null);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const t = setInterval(refresh, 8000);
    return () => clearInterval(t);
  }, [refresh]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (message.trim().length < 2) {
      toast.push("اكتب نص الرسالة أولًا", "error");
      return;
    }
    setBusy(true);
    try {
      const res = await api<{ broadcast: { id: string } }>("/api/broadcasts", {
        method: "POST",
        body: { message: message.trim(), tone, durationSeconds: duration, activeForMinutes: window_ },
      });
      toast.push(`تم البثّ — يظهر ${duration} ثوانٍ لكل مستخدم`, "success");
      setPreview(true);
      setTimeout(() => setPreview(false), duration * 1000 + 400);
      // اجعل البثّ يظهر للمدير نفسه فورًا داخل نفس الشاشة
      try {
        const seen = JSON.parse(window.localStorage.getItem("nebras.broadcast.seen") ?? "[]") as string[];
        window.localStorage.setItem(
          "nebras.broadcast.seen",
          JSON.stringify(seen.filter((id) => id !== res.broadcast.id)),
        );
      } catch {
        /* تجاهل */
      }
      await refresh();
    } catch (err) {
      toast.push(errorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  }

  async function stopLive() {
    if (!live) return;
    setStopping(true);
    try {
      await api(`/api/admin/broadcasts/${live.id}`, { method: "PATCH", body: { isActive: false } });
      toast.push("تم إيقاف البثّ الحالي", "info");
      await refresh();
    } catch (err) {
      toast.push(errorMessage(err), "error");
    } finally {
      setStopping(false);
    }
  }

  return (
    <>
      {/* مستمع البثّ داخل لوحة الإدارة أيضًا — المدير يرى رسالته كما يراها الطلاب */}
      <BroadcastListener />

      <Card className="overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-mist-100 bg-navy-900 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-500/15 text-gold-300">
              <IconLamp className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-sm font-extrabold text-white">بثّ رسالة فورية لكل المستخدمين</h2>
              <p className="mt-0.5 text-xs text-mist-400">تظهر الرسالة أعلى كل صفحات المنصة — للزوار والطلاب والمعلمين — لعدد ثوانٍ تحدده أنت.</p>
            </div>
          </div>
          {live ? (
            <Badge tone="success"><span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-success" /></span>بثّ حيّ الآن</Badge>
          ) : (
            <Badge className="bg-white/10 text-mist-300">لا بثّ حيّ</Badge>
          )}
        </div>

        <form onSubmit={send} className="grid gap-5 p-5 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-4">
            <TextArea
              label="نص الرسالة"
              required
              rows={3}
              maxLength={280}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="مثال: ونبدأ العام الدراسي الجديد 2027/2028"
              hint={`${message.length}/280 حرف — تظهر كما تكتبها تمامًا`}
            />

            <div className="grid gap-4 sm:grid-cols-3">
              <SelectField label="لون التنبيه" value={tone} onChange={(e) => setTone(e.target.value)} options={TONES} />
              <div>
                <label className="label" htmlFor="bc-duration">مدة الظهور (ثانية)</label>
                <input
                  id="bc-duration" type="number" min={3} max={60} className="field tabular-nums"
                  value={duration} onChange={(e) => setDuration(Math.max(3, Math.min(60, Number(e.target.value) || 10)))}
                />
                <p className="mt-1.5 text-xs text-mist-500">الافتراضي ١٠ ثوانٍ</p>
              </div>
              <div>
                <label className="label" htmlFor="bc-window">نافذة التسليم (دقيقة)</label>
                <input
                  id="bc-window" type="number" min={1} max={1440} className="field tabular-nums"
                  value={window_} onChange={(e) => setWindow(Math.max(1, Math.min(1440, Number(e.target.value) || 15)))}
                />
                <p className="mt-1.5 text-xs text-mist-500">لكل من يفتح المنصة خلالها</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Button type="submit" disabled={busy} variant="primary">
                {busy ? <Spinner /> : <IconBell className="h-4 w-4" />}
                {busy ? "جارٍ البثّ…" : `بثّ الآن لمدة ${duration} ثوانٍ`}
              </Button>
              {live && (
                <Button type="button" variant="outline" onClick={stopLive} disabled={stopping}>
                  {stopping ? <Spinner /> : <IconClose className="h-4 w-4" />}
                  إيقاف البثّ الحالي
                </Button>
              )}
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-mist-500">
                <IconTrend className="h-4 w-4 text-navy-500" />
                يُسلَّم تلقائيًا خلال ٦ ثوانٍ كحد أقصى لكل متصل
              </span>
            </div>
          </div>

          {/* معاينة حيّة */}
          <div>
            <p className="label">معاينة كما يراها المستخدم</p>
            <div className={cn("overflow-hidden rounded-2xl border border-mist-200 shadow-card transition", PREVIEW_BG[tone] ?? PREVIEW_BG.gold)}>
              <div className="flex items-start gap-3 px-4 py-3.5">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15">
                  <IconLamp className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[0.66rem] font-bold uppercase tracking-[0.14em] text-white/70">بثّ فوري من إدارة نبراس</p>
                  <p className="mt-1 font-display text-[0.95rem] font-extrabold leading-7 break-words">
                    {message.trim() || "اكتب رسالتك لتظهر هنا…"}
                  </p>
                </div>
                <span className="shrink-0 font-display text-sm font-extrabold tabular-nums text-white/85">{duration}ث</span>
              </div>
              <div className="h-1 w-full bg-black/15">
                <div className={cn("h-full", preview ? "animate-[shrink_linear_forwards]" : "w-full", "bg-gold-400")} style={preview ? { animationDuration: `${duration}s` } : undefined} />
              </div>
            </div>

            {live && (
              <div className="mt-4 rounded-xl border border-mist-200 bg-mist-50 p-4">
                <p className="text-xs font-extrabold text-navy-800">البثّ الحيّ الحالي</p>
                <p className="mt-1.5 text-[0.82rem] font-semibold leading-7 text-mist-700">{live.message}</p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <Badge tone="navy">{live.durationSeconds} ثانية</Badge>
                  <Badge tone="gold">{TONES.find((t) => t.value === live.tone)?.label.split(" — ")[0] ?? live.tone}</Badge>
                  {live.createdByName && <Badge tone="muted">بواسطة {live.createdByName}</Badge>}
                </div>
              </div>
            )}

            <p className="mt-3 flex items-start gap-2 text-[0.72rem] leading-6 text-mist-500">
              <IconCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              تظهر الرسالة مرة واحدة لكل مستخدم (تُسجَّل هويتها في متصفحه)، ولا تتكرر حتى تبثّ رسالة جديدة.
            </p>
          </div>
        </form>
      </Card>
    </>
  );
}
