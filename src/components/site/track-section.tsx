"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PackageSearch, Copy, Download, Bot, Timer, CheckCircle2, CircleDot, Circle,
  XCircle, LoaderCircle, FileCode2,
} from "lucide-react";
import { arDate, egp, timeAgo } from "@/lib/format";
import type { OrderEvent } from "@/lib/types";

type TrackedOrder = {
  code: string; name: string; serviceName: string; price: number; status: string;
  progress: number; assignee: string; deadline: string | null; deliveryDays: number;
  events: OrderEvent[]; createdAt: string; deliverable: string; deliverableName: string;
};

const STEPS = [
  { key: "new", label: "اتسجل" },
  { key: "accepted", label: "مقبول" },
  { key: "inprogress", label: "قيد التنفيذ" },
  { key: "review", label: "مراجعة الجودة" },
  { key: "delivered", label: "تم التسليم" },
];

export default function TrackSection() {
  const [form, setForm] = useState({ code: "", phone: "" });
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    try {
      const r = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!d.ok) {
        setState("error");
        setErr(d.error ?? "مش لاقيين الطلب");
        return;
      }
      setOrder(d.order);
      setState("done");
    } catch {
      setState("error");
      setErr("النت عمل مشكلة.. جرب تاني");
    }
  }

  function download() {
    if (!order) return;
    const blob = new Blob([order.deliverable], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = order.deliverableName || `${order.code}-source.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const stepIndex = order ? Math.max(0, STEPS.findIndex((s) => s.key === order.status)) : 0;

  return (
    <section id="track" className="relative py-24">
      <div className="absolute inset-x-0 top-0 mx-auto h-px max-w-5xl bg-gradient-to-l from-transparent via-cyan-500/30 to-transparent" />
      <div className="mx-auto max-w-4xl px-5">
        <div className="text-center">
          <p className="font-mono text-xs font-bold tracking-[0.4em] text-cyan-300">— TRACK —</p>
          <h2 className="mt-3 text-4xl font-black sm:text-5xl">
            تتبع طلبك <span className="text-grad">لحظة بلحظة</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-400">
            عندك كود NV؟ اكتبه مع رقم موبايلك وهتلاقي حالة طلبك، نسبة الإنجاز، معاد التسليم المحدد، وملف الكود كامل لما يتسلم.
          </p>
        </div>

        {/* فورم التتبع */}
        <form onSubmit={submit} className="glass mx-auto mt-10 flex max-w-2xl flex-col gap-3 rounded-3xl p-5 sm:flex-row">
          <input
            className="nova-input flex-1 font-mono !tracking-widest" dir="ltr"
            placeholder="NV-0000" value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            required
          />
          <input
            className="nova-input flex-1" dir="ltr"
            placeholder="رقم موبايلك" value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            required
          />
          <button type="submit" disabled={state === "loading"} className="btn-neon flex items-center justify-center gap-2 rounded-xl px-7 py-3 text-sm font-black text-white disabled:opacity-50">
            {state === "loading" ? <LoaderCircle className="size-4 animate-spin" /> : <PackageSearch className="size-4" />}
            تتبع
          </button>
        </form>
        {state === "error" && <p className="mt-4 text-center text-sm font-bold text-rose-400">{err}</p>}

        {/* نتيجة التتبع */}
        <AnimatePresence>
          {state === "done" && order && (
            <motion.div
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="glass mt-8 overflow-hidden rounded-3xl"
            >
              <div className="border-b border-white/[0.07] bg-gradient-to-l from-violet-600/15 to-cyan-500/10 px-7 py-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs font-black tracking-widest text-cyan-300" dir="ltr">{order.code}</p>
                    <h3 className="mt-1 text-xl font-black">{order.serviceName}</h3>
                    <p className="mt-0.5 text-xs text-slate-400">يا {order.name}، طلبك قيمته {egp(order.price)}</p>
                  </div>
                  {order.assignee && (
                    <span className="flex items-center gap-2 rounded-full bg-violet-500/15 px-4 py-2 text-xs font-bold text-violet-200">
                      <Bot className="size-4" /> المسؤول: {order.assignee}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-7">
                {order.status === "rejected" ? (
                  <div className="flex items-center gap-3 rounded-2xl bg-rose-500/10 p-5 text-sm font-bold text-rose-300">
                    <XCircle className="size-6" /> اعتذرنا عن الطلب ده — كلمنا على 01503724381 وهنوضحلك كل حاجة.
                  </div>
                ) : (
                  <>
                    {/* الخطوات */}
                    <div className="flex items-center">
                      {STEPS.map((s, i) => {
                        const done = i < stepIndex || order.status === "delivered";
                        const current = i === stepIndex;
                        return (
                          <div key={s.key} className="flex flex-1 items-center last:flex-none">
                            <div className="flex flex-col items-center gap-1.5">
                              {done ? (
                                <CheckCircle2 className="size-6 text-emerald-400" />
                              ) : current ? (
                                <CircleDot className="size-6 anim-pulse-dot text-violet-400" />
                              ) : (
                                <Circle className="size-6 text-slate-700" />
                              )}
                              <span className={`whitespace-nowrap text-[10px] font-bold ${current ? "text-violet-300" : done ? "text-emerald-300" : "text-slate-600"}`}>
                                {s.label}
                              </span>
                            </div>
                            {i < STEPS.length - 1 && (
                              <div className={`mx-2 mb-5 h-0.5 flex-1 rounded ${done ? "bg-emerald-500/60" : "bg-white/10"}`} />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* نسبة الإنجاز */}
                    <div className="mt-6">
                      <div className="mb-1.5 flex justify-between text-xs font-bold text-slate-400">
                        <span>نسبة الإنجاز الكلية</span>
                        <span className="font-mono text-cyan-300">{order.progress}%</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-white/5">
                        <motion.div
                          initial={{ width: 0 }} animate={{ width: `${order.progress}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full rounded-full bg-gradient-to-l from-violet-500 via-fuchsia-500 to-cyan-400"
                        />
                      </div>
                    </div>

                    {order.deadline && order.status !== "delivered" && (
                      <div className="mt-5 flex items-center gap-3 rounded-2xl bg-cyan-500/[0.08] p-4">
                        <Timer className="size-5 text-cyan-300" />
                        <p className="text-sm font-bold text-cyan-200">
                          الذكاء الاصطناعي حدد التسليم: {arDate(order.deadline)}
                        </p>
                      </div>
                    )}

                    {/* ملف الكود */}
                    {order.status === "delivered" && order.deliverable && (
                      <div className="mt-6 overflow-hidden rounded-2xl border border-emerald-500/30">
                        <div className="flex flex-wrap items-center justify-between gap-3 bg-emerald-500/10 px-5 py-3">
                          <span className="flex items-center gap-2 text-sm font-black text-emerald-300">
                            <FileCode2 className="size-4" /> ملف الكود جاهز — <span className="font-mono" dir="ltr">{order.deliverableName}</span>
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => { navigator.clipboard.writeText(order.deliverable); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                              className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold transition hover:bg-white/20"
                            >
                              <Copy className="size-3.5" /> {copied ? "اتنسخ!" : "نسخ"}
                            </button>
                            <button onClick={download} className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-black text-emerald-950 transition hover:bg-emerald-400">
                              <Download className="size-3.5" /> تحميل الملف
                            </button>
                          </div>
                        </div>
                        <pre dir="ltr" className="max-h-56 overflow-auto bg-black/50 p-5 font-mono text-[11px] leading-relaxed text-emerald-100/80">
                          {order.deliverable}
                        </pre>
                      </div>
                    )}

                    {/* السجل */}
                    <div className="mt-6 border-t border-white/[0.07] pt-5">
                      <p className="mb-3 text-xs font-bold text-slate-500">سجل التحديثات</p>
                      <ul className="space-y-2.5">
                        {[...order.events].reverse().slice(0, 6).map((ev, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-xs">
                            <span className="mt-1 size-1.5 shrink-0 rounded-full bg-cyan-400/70" />
                            <span className="flex-1 text-slate-300">{ev.text}</span>
                            <span className="shrink-0 text-[10px] text-slate-600">{timeAgo(ev.t)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
