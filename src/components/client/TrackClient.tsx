"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Search,
  Loader2,
  Download,
  Eye,
  Send,
  Star,
  CheckCircle2,
  Clock,
  MessageSquare,
  AlertTriangle,
  PackageCheck,
} from "lucide-react";
import { NovaMark } from "@/components/site/Logo";

const STATUS_AR: Record<string, { label: string; tone: string }> = {
  intake: { label: "العقل المركزي يحلل طلبك الآن", tone: "text-cyan-300" },
  planned: { label: "الخطة جاهزة", tone: "text-violet-300" },
  awaiting_confirm: { label: "الخطة والتقدير بانتظار الاعتماد", tone: "text-amber-300" },
  running: { label: "الفريق الذكي يعمل على مشروعك الآن", tone: "text-emerald-300" },
  paused: { label: "التنفيذ متوقف مؤقتاً — الإدارة متابعة", tone: "text-amber-300" },
  blocked: { label: "يوجد إيقاف تقني — فريق الإدارة يعمل عليه", tone: "text-rose-300" },
  delivered: { label: "تم تسليم مشروعك 🎉", tone: "text-emerald-300" },
  cancelled: { label: "تم إيقاف المشروع", tone: "text-ink-dim" },
  failed: { label: "المشروع متعثر — الإدارة متابعة", tone: "text-rose-300" },
};

const PIPELINE = ["استقبال", "تحليل", "خطة وتقدير", "اعتماد", "تنفيذ", "مراجعة واختبار", "أمان", "تسليم"];

function stageOf(status: string): number {
  switch (status) {
    case "intake": return 1;
    case "needs_info":
    case "planned":
    case "awaiting_confirm": return 3;
    case "running":
    case "paused": return 5;
    case "blocked":
    case "failed": return 6;
    case "delivered": return 8;
    default: return 1;
  }
}

interface TrackData {
  project: Record<string, unknown> & { status: string; code: string; title: string };
  tasks: Record<string, unknown>[];
  events: Record<string, unknown>[];
  files: Record<string, unknown>[];
  testSummary: { pass: number; fail: number; total: number };
  estimates: Record<string, unknown>[];
  messages: Record<string, unknown>[];
  feedback: { given: boolean };
}

export function TrackClient({ code }: { code: string }) {
  const [data, setData] = useState<TrackData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [msg, setMsg] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverStar, setHoverStar] = useState(0);
  const [comment, setComment] = useState("");
  const [hasIssue, setHasIssue] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/projects/track/${encodeURIComponent(code)}`, { cache: "no-store" });
      if (r.status === 404) {
        setNotFound(true);
        return;
      }
      if (r.ok) setData((await r.json()) as TrackData);
    } catch {
      // ignore
    }
  }, [code]);

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [data?.messages.length]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  if (notFound) {
    return (
      <div className="glass mx-auto max-w-md rounded-3xl p-10 text-center">
        <AlertTriangle size={34} className="mx-auto text-amber-300" />
        <h2 className="font-display mt-4 text-xl font-black text-white">رمز المتابعة غير صحيح</h2>
        <p className="mt-2 text-sm text-ink-dim">تأكد من الرمز (بصيغة NB-XXXXXX) الذي وصلك عند إرسال الطلب، أو تواصل معنا على واتساب 01503724381.</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex justify-center py-24 text-ink-dim">
        <Loader2 className="animate-spin" size={22} />
        <span className="ms-3 text-sm">جارٍ جلب حالة المشروع...</span>
      </div>
    );
  }

  const p = data.project;
  const st = STATUS_AR[p.status] ?? STATUS_AR.intake;
  const stage = stageOf(p.status);
  const delivered = p.status === "delivered";

  async function sendMsg() {
    if (msg.trim().length < 3) return;
    setBusy("msg");
    await fetch(`/api/projects/track/${encodeURIComponent(code)}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: msg.trim() }),
    });
    setMsg("");
    setBusy(null);
    await load();
  }

  async function sendFeedback() {
    if (!rating) {
      setToast("اختر التقييم بالنجوم أولاً");
      return;
    }
    setBusy("fb");
    const r = await fetch(`/api/projects/track/${encodeURIComponent(code)}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, comment, hasIssue }),
    });
    const d = await r.json().catch(() => null);
    setToast(r.ok ? "شكراً لتقييمك — وصل إلينا" : d?.error ?? "فشل الإرسال");
    setBusy(null);
    await load();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-5 py-10">
      {/* الرأس */}
      <div className="glass rounded-[2rem] p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-ink-dim">
              <NovaMark size={20} />
              NEBRAS AI — تتبع مشروعك
            </div>
            <h1 className="font-display mt-2 text-2xl font-black text-white">{p.title}</h1>
            <span dir="ltr" className="font-mono text-sm text-cyan-300">{p.code}</span>
          </div>
          <div className={`font-display text-lg font-black ${st.tone}`}>{st.label}</div>
        </div>

        {/* خط المراحل */}
        <div className="mt-7 flex items-center">
          {PIPELINE.map((s, i) => (
            <div key={s} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-black ${
                    i < stage
                      ? "bg-gradient-to-br from-violet-500 to-cyan-500 text-white"
                      : i === stage
                        ? "border-2 border-cyan-400 bg-cyan-400/15 text-cyan-200"
                        : "border border-white/15 text-ink-dim"
                  }`}
                >
                  {i < stage ? <CheckCircle2 size={14} /> : i + 1}
                </span>
                <span className={`mt-1.5 whitespace-nowrap text-[9px] font-bold ${i <= stage ? "text-white" : "text-ink-dim"}`}>{s}</span>
              </div>
              {i < PIPELINE.length - 1 && (
                <div className={`mx-1 mb-5 h-0.5 flex-1 rounded ${i < stage ? "bg-gradient-to-l from-violet-500 to-cyan-400" : "bg-white/10"}`} />
              )}
            </div>
          ))}
        </div>

        {/* التقدم + ETA */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="glass-soft rounded-2xl p-4">
            <div className="text-[10px] text-ink-dim">التقدم (وزن المهام المُنجز والمُتحقق منه)</div>
            <div className="font-display mt-1 text-2xl font-black text-white">{Number(p.progress)}%</div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/5">
              <div className="h-full rounded-full bg-gradient-to-l from-violet-500 to-cyan-400 transition-all duration-700" style={{ width: `${Number(p.progress)}%` }} />
            </div>
          </div>
          <div className="glass-soft rounded-2xl p-4">
            <div className="flex items-center gap-1.5 text-[10px] text-ink-dim">
              <Clock size={11} /> موعد التسليم المتوقع (يُحدَّث بالمدة الفعلية)
            </div>
            <div className="font-display mt-1 text-lg font-black text-cyan-300">
              {p.eta ? new Date(String(p.eta)).toLocaleString("ar-EG", { dateStyle: "short", timeStyle: "short" }) : "—"}
            </div>
            <div className="text-[10px] text-ink-dim">درجة الثقة: {p.etaConfidence ? Number(p.etaConfidence) : "—"}%</div>
          </div>
          <div className="glass-soft rounded-2xl p-4">
            <div className="text-[10px] text-ink-dim">فحوصات الجودة الفعلية</div>
            <div className="font-display mt-1 text-lg font-black text-emerald-300">
              {data.testSummary.pass} ناجحة <span className="text-rose-300">{data.testSummary.fail} فاشلة</span>
            </div>
            <div className="text-[10px] text-ink-dim">لا يُعلن نجاح إلا بفلحص شُغّل فعلياً</div>
          </div>
        </div>

        {/* معلومات ناقصة */}
        {p.missingInfo ? (
          <div className="mt-4 rounded-2xl border border-amber-400/25 bg-amber-400/5 p-4">
            <div className="text-xs font-black text-amber-300">نحتاج منك لتأكيد — أرسلها في الرسائل بالأسفل:</div>
            <ul className="mt-2 space-y-1 text-[12px] text-ink">
              {String(p.missingInfo).split("\n").filter(Boolean).map((m, i) => (
                <li key={i}>• {m}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      {/* مهام الفريق */}
      <div className="glass rounded-[2rem] p-7">
        <h2 className="font-display text-base font-black text-white">مهام فريقك الذكي</h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {data.tasks.map((t, i) => (
            <div key={i} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-[12px] ${t.status === "done" ? "bg-emerald-400/8" : t.status === "running" ? "bg-cyan-400/10" : t.status === "failed" ? "bg-rose-400/10" : "bg-white/3"}`}>
              {t.status === "done" ? <CheckCircle2 size={15} className="text-emerald-400" /> : t.status === "running" ? <Loader2 size={15} className="animate-spin text-cyan-300" /> : <span className="h-3 w-3 rounded-full border border-white/25" />}
              <div className="min-w-0 flex-1">
                <div className="truncate font-bold text-white">{String(t.title)}</div>
                <div className="text-[10px] text-ink-dim">{String(t.agentName)}</div>
              </div>
            </div>
          ))}
          {data.tasks.length === 0 && <p className="text-xs text-ink-dim">ستظهر المهام فور اكتمال التحليل.</p>}
        </div>
      </div>

      {/* التسليم: ملفات + معاينة + تحميل */}
      {delivered && (
        <div className="glass rounded-[2rem] border-emerald-400/25 p-7">
          <div className="flex items-center gap-2">
            <PackageCheck size={20} className="text-emerald-300" />
            <h2 className="font-display text-base font-black text-white">ملفات التسليم الجاهزة</h2>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {data.files.map((f, i) => (
              <div key={i} className="glass-soft rounded-xl px-3 py-2.5 font-mono text-[11px] text-ink" dir="ltr">
                {String(f.path)} <span className="text-ink-dim">({Number(f.size)}B)</span>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <a href={`/api/projects/track/${encodeURIComponent(code)}/download`} className="btn-primary flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-black text-white">
              <Download size={16} /> تحميل كل الملفات (ZIP)
            </a>
            <a href={`/api/projects/track/${encodeURIComponent(code)}/preview`} target="_blank" rel="noreferrer" className="glass-soft flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-cyan-200 transition hover:border-cyan-400/40">
              <Eye size={16} /> معاينة حية (للمشاريع Web)
            </a>
          </div>
        </div>
      )}

      {/* السجل الزمني */}
      <div className="glass rounded-[2rem] p-7">
        <h2 className="font-display text-base font-black text-white">آخر المستجدات</h2>
        <div className="mt-4 max-h-72 space-y-2 overflow-y-auto pl-1">
          {data.events.slice(0, 14).map((e, i) => (
            <div key={i} className="glass-soft rounded-xl px-4 py-2.5 text-[12px]">
              <span className="font-bold text-cyan-300">{String(e.actor)}: </span>
              <span className="text-ink">{String(e.message)}</span>
              <span className="ms-2 text-[10px] text-ink-dim">{new Date(String(e.at)).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          ))}
        </div>
      </div>

      {/* الرسائل */}
      <div className="glass rounded-[2rem] p-7">
        <h2 className="font-display flex items-center gap-2 text-base font-black text-white">
          <MessageSquare size={17} /> رسائل بينك وبين فريق NEBRAS AI
        </h2>
        <div ref={listRef} className="mt-4 max-h-64 space-y-2.5 overflow-y-auto">
          {data.messages.map((m, i) => (
            <div key={i} className={`flex ${m.sender === "client" ? "justify-end" : ""}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed whitespace-pre-line ${m.sender === "client" ? "bg-gradient-to-l from-violet-600 to-violet-700 text-white" : "glass-soft text-ink"}`}>
                {String(m.content)}
                <div className={`mt-1 text-[9px] ${m.sender === "client" ? "text-white/60" : "text-ink-dim"}`}>
                  {m.sender === "client" ? "أنت" : m.sender === "system" ? "فريق NEBRAS AI" : "المطور"} • {new Date(String(m.at)).toLocaleString("ar-EG", { dateStyle: "short", timeStyle: "short" })}
                </div>
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); void sendMsg(); }} className="mt-4 flex gap-2">
          <input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="اكتب سؤالك أو المعلومة المطلوبة..." className="field flex-1 !rounded-xl text-sm" />
          <button disabled={busy === "msg" || msg.trim().length < 3} className="btn-primary flex h-11 w-12 items-center justify-center rounded-xl text-white disabled:opacity-50" aria-label="إرسال">
            {busy === "msg" ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} className="-scale-x-100" />}
          </button>
        </form>
      </div>

      {/* التقييم */}
      {delivered && (
        <div className="glass rounded-[2rem] p-7">
          <h2 className="font-display text-base font-black text-white">قيّم النتيجة</h2>
          {data.feedback.given ? (
            <p className="mt-3 text-sm text-emerald-300">شكراً — استلمنا تقييمك وهو لدى فريق العمليات الآن.</p>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => setRating(n)} onMouseEnter={() => setHoverStar(n)} onMouseLeave={() => setHoverStar(0)} className="text-2xl transition" aria-label={`${n} نجوم`}>
                    <Star size={26} className={n <= (hoverStar || rating) ? "fill-amber-400 text-amber-400" : "text-white/20"} />
                  </button>
                ))}
              </div>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder="ملاحظتك تساعدنا (اختياري)..." className="field resize-none text-sm" />
              <label className="flex items-center gap-2 text-sm text-ink-dim">
                <input type="checkbox" checked={hasIssue} onChange={(e) => setHasIssue(e.target.checked)} className="h-4 w-4 accent-rose-400" />
                أبلغ عن مشكلة في التسليم (سيصل مباشرة للإدارة)
              </label>
              <button disabled={busy === "fb"} onClick={() => void sendFeedback()} className="btn-primary rounded-xl px-6 py-3 text-sm font-black text-white disabled:opacity-50">
                إرسال التقييم
              </button>
            </div>
          )}
        </div>
      )}

      {toast && (
        <div className="glass fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-2xl border-cyan-400/40 px-6 py-3 text-sm font-bold text-cyan-200">{toast}</div>
      )}
    </div>
  );
}

export function TrackEntry() {
  const [code, setCode] = useState("");
  const [err, setErr] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-md px-5 py-16">
      <div className="glass rounded-[2rem] p-9">
        <div className="flex flex-col items-center text-center">
          <NovaMark size={44} />
          <h1 className="font-display mt-4 text-2xl font-black text-white">تتبع مشروعك</h1>
          <p className="mt-2 text-sm text-ink-dim">أدخل رمز المتابعة (NB-XXXXXX) الذي وصلك عند إرسال الطلب — بيانات مشروعك تظهر لك أنت فقط.</p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const c = code.trim().toUpperCase();
            if (!/^NB-[A-Z0-9]{4,10}$/.test(c)) {
              setErr("الرمز غير صحيح — الصيغة: NB-متبوعاً بـ 6 رموز");
              return;
            }
            window.location.href = `/track/${c}`;
          }}
          className="mt-7 space-y-4"
        >
          <input value={code} onChange={(e) => { setCode(e.target.value); setErr(null); }} placeholder="NB-XXXXXX" dir="ltr" className="field text-center font-mono text-lg tracking-widest" />
          {err && <p className="text-center text-xs font-bold text-rose-300">{err}</p>}
          <button className="btn-primary flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-display text-sm font-black text-white">
            <Search size={16} /> عرض حالة المشروع
          </button>
        </form>
      </div>
    </div>
  );
}
