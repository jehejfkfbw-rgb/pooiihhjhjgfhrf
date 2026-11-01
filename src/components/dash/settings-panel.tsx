"use client";

import { useEffect, useRef, useState } from "react";
import { Save, Bot, Send, CalendarClock, MessageSquareText, FlaskConical } from "lucide-react";
import { api, Field, Spinner, Toggle, Panel } from "./ui";
import type { Notify } from "./shell";
import { DAY_NAMES } from "@/lib/nova-ai";

type Settings = Record<string, string>;

export default function SettingsPanel({ notify }: { notify: Notify }) {
  const [s, setS] = useState<Settings | null>(null);
  const [days, setDays] = useState<number[]>([6, 0, 1, 2, 3, 4]);
  const [saving, setSaving] = useState(false);

  // مختبر البوت
  const [testMsgs, setTestMsgs] = useState<{ role: "user" | "bot"; text: string }[]>([]);
  const [testInput, setTestInput] = useState("");
  const [testing, setTesting] = useState(false);
  const testRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api<{ settings: Settings }>("/api/admin/settings").then((d) => {
      setS(d.settings);
      try { setDays(JSON.parse(d.settings.work_days)); } catch { /* keep */ }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    testRef.current?.scrollTo({ top: testRef.current.scrollHeight, behavior: "smooth" });
  }, [testMsgs]);

  async function save() {
    if (!s) return;
    setSaving(true);
    await api("/api/admin/settings", {
      method: "PUT",
      body: JSON.stringify({ ...s, work_days: JSON.stringify(days) }),
    });
    setSaving(false);
    notify("تم حفظ إعدادات النواة — التطبيق فوري");
  }

  async function askBot() {
    const msg = testInput.trim();
    if (!msg || testing) return;
    setTestInput("");
    setTestMsgs((m) => [...m, { role: "user", text: msg }]);
    setTesting(true);
    const d = await api<{ reply: string }>("/api/chat", {
      method: "POST",
      body: JSON.stringify({ message: msg, sessionId: "dev-console", force: true }),
    });
    setTestMsgs((m) => [...m, { role: "bot", text: d.reply ?? "مفيش رد" }]);
    setTesting(false);
  }

  if (!s) return <Spinner />;

  const toggleDay = (d: number) =>
    setDays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d].sort()));

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <div className="space-y-5">
        {/* تشغيل البوت */}
        <Panel title="تشغيل المساعد الذكي" icon={<Bot className="size-4 text-cyan-300" />} sub="قفل البوت بيوقف الردود على الموقع كلها">
          <div className="flex items-center justify-between rounded-xl bg-white/[0.03] px-4 py-3.5">
            <div>
              <p className="text-sm font-black">{s.bot_enabled === "true" ? "البوت شغال وبيرد على العملاء" : "البوت متوقف"}</p>
              <p className="mt-0.5 text-[11px] text-slate-500">لو قفلته هيقول للعملاء إنه في صيانة ويوجّههم للرقم</p>
            </div>
            <Toggle on={s.bot_enabled === "true"} onChange={(v) => setS({ ...s, bot_enabled: v ? "true" : "false" })} />
          </div>
        </Panel>

        {/* مواعيد الشغل */}
        <Panel title="مواعيد شغل البوت" icon={<CalendarClock className="size-4 text-violet-300" />} sub="خارج المواعيد دي البوت يقول إنه في وضع السكون — بتوقيت القاهرة">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="من الساعة">
              <input type="time" className="nova-input" value={s.hours_start} onChange={(e) => setS({ ...s, hours_start: e.target.value })} dir="ltr" />
            </Field>
            <Field label="لحد الساعة">
              <input type="time" className="nova-input" value={s.hours_end} onChange={(e) => setS({ ...s, hours_end: e.target.value })} dir="ltr" />
            </Field>
          </div>
          <div className="mt-4">
            <p className="mb-2 text-[11px] font-bold text-slate-400">أيام العمل</p>
            <div className="flex flex-wrap gap-2">
              {DAY_NAMES.map((n, i) => (
                <button
                  key={n}
                  onClick={() => toggleDay(i)}
                  className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                    days.includes(i) ? "btn-neon text-white" : "bg-white/5 text-slate-500 hover:text-white"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </Panel>

        {/* الرسائل */}
        <Panel title="رسائل البوت" icon={<MessageSquareText className="size-4 text-pink-300" />} sub="خصّص اللي بيقوله للعملاء">
          <div className="space-y-4">
            <Field label="رسالة الترحيب (أول ما العميل يفتح الشات)">
              <textarea className="nova-input min-h-24 resize-y" value={s.welcome_msg} onChange={(e) => setS({ ...s, welcome_msg: e.target.value })} />
            </Field>
            <Field label="رسالة خارج المواعيد — متاح فيها {start} و {end} و {days}">
              <textarea className="nova-input min-h-24 resize-y" value={s.offhours_msg} onChange={(e) => setS({ ...s, offhours_msg: e.target.value })} />
            </Field>
          </div>
        </Panel>

        <button onClick={save} disabled={saving} className="btn-neon flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-black text-white disabled:opacity-50">
          <Save className="size-5" />
          {saving ? "جاري الحفظ..." : "احفظ إعدادات النواة"}
        </button>
      </div>

      {/* مختبر البوت */}
      <Panel title="مختبر البوت" icon={<FlaskConical className="size-4 text-emerald-300" />} sub="جرّب أي سؤال هنا — الاختبار بيتخطى مواعيد الشغل">
        <div ref={testRef} className="h-96 space-y-3 overflow-y-auto rounded-xl bg-black/30 p-4">
          {testMsgs.length === 0 && (
            <p className="pt-32 text-center text-xs text-slate-600">اسأل البوت أي حاجة وشوف هيرد إزاي...<br />مثال: &quot;بكام المتجر الإلكتروني؟&quot;</p>
          )}
          {testMsgs.map((m, i) => (
            <div key={i} className={`max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
              m.role === "user" ? "mr-auto rounded-tl-md bg-violet-600 font-bold text-white" : "ml-auto rounded-tr-md bg-white/[0.07] text-slate-200"
            }`}>
              {m.text}
            </div>
          ))}
          {testing && <p className="text-center font-mono text-[10px] text-slate-600">NOVA CORE is thinking...</p>}
        </div>
        <div className="mt-3 flex gap-2">
          <input
            className="nova-input flex-1"
            placeholder="اكتب سؤال العميل..."
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && askBot()}
          />
          <button onClick={askBot} disabled={testing} className="btn-neon grid size-11 shrink-0 place-items-center rounded-xl text-white disabled:opacity-40">
            <Send className="size-4 -scale-x-100" />
          </button>
        </div>
      </Panel>
    </div>
  );
}
