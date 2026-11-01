"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, X, Sparkles } from "lucide-react";

type Msg = { role: "user" | "bot"; text: string };

const CHIPS = ["الأسعار بكام؟", "عندكم إيه خدمات؟", "رقمكم وواتساب", "مواعيد الشغل", "مدة التنفيذ قد إيه؟"];

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [online, setOnline] = useState(true);
  const [session, setSession] = useState("");
  const bodyRef = useRef<HTMLDivElement>(null);
  const welcomed = useRef(false);

  useEffect(() => {
    let sid = localStorage.getItem("nova-session");
    if (!sid) {
      sid = crypto.randomUUID();
      localStorage.setItem("nova-session", sid);
    }
    setSession(sid);
  }, []);

  useEffect(() => {
    if (!open || welcomed.current) return;
    welcomed.current = true;
    fetch("/api/chat")
      .then((r) => r.json())
      .then((d) => {
        setOnline(Boolean(d.enabled && d.withinHours));
        setMsgs([{ role: "bot", text: d.welcome ?? "أهلًا بيك في نوفا ديجيتال! اسألني عن أي حاجة." }]);
      })
      .catch(() => setMsgs([{ role: "bot", text: "أهلًا بيك في نوفا ديجيتال! اسألني عن أي حاجة." }]));
  }, [open]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, typing]);

  async function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || typing) return;
    setInput("");
    setMsgs((m) => [...m, { role: "user", text: msg }]);
    setTyping(true);
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, sessionId: session }),
      });
      const d = await r.json();
      setMsgs((m) => [...m, { role: "bot", text: d.reply ?? "جرب تاني بعد ثانية" }]);
      if (typeof d.withinHours === "boolean") setOnline(d.withinHours);
    } catch {
      setMsgs((m) => [...m, { role: "bot", text: "النت عندك عمل مشكلة.. كلمنا على 01503724381" }]);
    } finally {
      setTyping(false);
    }
  }

  return (
    <>
      {/* زرار الفتح */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-5 left-5 z-[60] group"
        aria-label="افتح المساعد الذكي"
      >
        <span className="absolute inset-0 rounded-2xl bg-violet-500/40 blur-xl transition group-hover:bg-violet-400/60" />
        <span className="btn-neon relative flex size-14 items-center justify-center rounded-2xl text-white shadow-2xl">
          {open ? <X className="size-6" /> : <Bot className="size-7" />}
        </span>
        {!open && (
          <span className="absolute -top-1 -right-1 flex size-4">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-70" />
            <span className="relative inline-flex size-4 rounded-full border-2 border-[#03040c] bg-emerald-400" />
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="fixed bottom-24 left-5 z-[60] flex h-[540px] w-[min(92vw,400px)] flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#070914]/95 shadow-[0_40px_120px_-20px_rgba(124,58,237,0.5)] backdrop-blur-2xl"
          >
            {/* الهيدر */}
            <div className="relative border-b border-white/10 bg-gradient-to-l from-violet-600/25 via-transparent to-cyan-500/20 px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="btn-neon grid size-11 place-items-center rounded-xl text-white">
                  <Bot className="size-6" />
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black">نورا — مساعدة نوفا</h3>
                    <span className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${online ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"}`}>
                      <span className={`size-1.5 rounded-full anim-pulse-dot ${online ? "bg-emerald-400" : "bg-amber-400"}`} />
                      {online ? "متاحة الآن" : "خارج المواعيد"}
                    </span>
                  </div>
                  <p className="mt-0.5 flex items-center gap-1 font-mono text-[10px] text-slate-500">
                    <Sparkles className="size-3 text-violet-400" />
                    NOVA CORE v3 — ذكاء محلي بالكامل
                  </p>
                </div>
              </div>
            </div>

            {/* الرسائل */}
            <div ref={bodyRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
              {msgs.map((m, idx) => (
                <div key={idx} className={`flex ${m.role === "user" ? "justify-start flex-row-reverse" : ""}`}>
                  {m.role === "bot" && (
                    <span className="ml-2 mt-1 grid size-7 shrink-0 place-items-center rounded-lg bg-violet-600/30">
                      <Bot className="size-4 text-violet-300" />
                    </span>
                  )}
                  <div
                    className={`max-w-[82%] whitespace-pre-line rounded-2xl px-4 py-3 text-[13.5px] leading-relaxed ${
                      m.role === "user"
                        ? "rounded-tl-md bg-gradient-to-br from-violet-600 to-indigo-600 font-semibold text-white"
                        : "rounded-tr-md bg-white/[0.06] text-slate-200 border border-white/[0.06]"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {typing && (
                <div className="flex items-center gap-2">
                  <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-violet-600/30">
                    <Bot className="size-4 text-violet-300" />
                  </span>
                  <div className="flex gap-1.5 rounded-2xl bg-white/[0.06] px-4 py-3.5">
                    <span className="typing-dot size-1.5 rounded-full bg-violet-300" />
                    <span className="typing-dot size-1.5 rounded-full bg-violet-300" />
                    <span className="typing-dot size-1.5 rounded-full bg-violet-300" />
                  </div>
                </div>
              )}
            </div>

            {/* شرائح سريعة */}
            <div className="flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none]">
              {CHIPS.map((c) => (
                <button
                  key={c}
                  onClick={() => send(c)}
                  className="shrink-0 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-[11px] font-bold text-violet-200 transition hover:bg-violet-500/25"
                >
                  {c}
                </button>
              ))}
            </div>

            {/* الإدخال */}
            <form
              onSubmit={(e) => { e.preventDefault(); send(); }}
              className="flex items-center gap-2 border-t border-white/10 p-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="اكتب سؤالك هنا..."
                className="nova-input flex-1 !rounded-2xl"
              />
              <button
                type="submit"
                disabled={!input.trim() || typing}
                className="btn-neon grid size-11 shrink-0 place-items-center rounded-2xl text-white disabled:opacity-40"
                aria-label="إرسال"
              >
                <Send className="size-4 -scale-x-100" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
