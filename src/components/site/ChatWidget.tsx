"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, SendHorizonal, Loader2, Sparkles } from "lucide-react";

interface Msg {
  role: "user" | "assistant";
  content: string;
  agent?: string;
}

const SUGGESTIONS = [
  "ما هي أسعاركم بالجنيه المصري؟",
  "عايز أطلب متجر إلكتروني",
  "هل تخدمون السعودية؟",
  "إزاي أتواصل معاكم؟",
];

export function ChatWidget({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSessionId(crypto.randomUUID());
    setMessages([
      {
        role: "assistant",
        agent: "ليلى",
        content:
          "أهلاً وسهلاً بك في نوفا كود. أنا ليلى من فريق خدمة العملاء — أساعدك في التعرف على خدماتنا وأسعارنا بالجنيه المصري والريال السعودي. كيف أقدر أخدمك اليوم؟",
      },
    ]);
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setInput("");
    const history = messages.filter((m) => m.role === "user" || m.role === "assistant");
    setMessages((prev) => [...prev, { role: "user", content }]);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: content, history }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply, agent: data.agent },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          agent: "النظام",
          content:
            "واجهتنا مشكلة مؤقتة في الاتصال — تقدر تتواصل معنا مباشرة على واتساب 01503724381 وسنرد فوراً.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* زر فتح المحادثة */}
      <motion.button
        onClick={onToggle}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: "spring", stiffness: 260, damping: 18 }}
        className="btn-primary fixed bottom-6 start-6 z-50 flex h-14 w-14 items-center justify-center rounded-2xl text-white"
        aria-label="تحدث مع فريق نوفا كود"
      >
        {open ? <X size={24} /> : <Bot size={24} />}
        {!open && (
          <span className="absolute -top-1 -end-1 flex h-4 w-4">
            <span className="absolute h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
            <span className="relative h-4 w-4 rounded-full bg-cyan-400" />
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="glass fixed bottom-24 start-4 z-50 flex h-[560px] w-[calc(100vw-2rem)] max-w-[400px] flex-col overflow-hidden rounded-[1.6rem] shadow-[0_30px_90px_-20px_rgba(0,0,0,0.8)] sm:start-6"
          >
            {/* الرأس */}
            <div className="bg-gradient-to-l from-violet-700/50 to-cyan-700/40 px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-cyan-200">
                  <Bot size={22} />
                </span>
                <div>
                  <div className="font-display text-sm font-black text-white">
                    فريق خدمة عملاء نوفا كود
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-300">
                    <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-emerald-400" />
                    متصل الآن — ليلى وفهد في الخدمة
                  </div>
                </div>
              </div>
            </div>

            {/* الرسائل */}
            <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto p-4">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === "user" ? "justify-start flex-row-reverse" : ""}`}
                >
                  <div
                    className={`max-w-[86%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed whitespace-pre-line ${
                      m.role === "user"
                        ? "bg-gradient-to-l from-violet-600 to-violet-700 text-white"
                        : "glass-soft text-ink"
                    }`}
                  >
                    {m.agent && m.role === "assistant" && (
                      <div className="mb-1 flex items-center gap-1 text-[10px] font-bold text-cyan-300">
                        <Sparkles size={10} />
                        {m.agent} — نوفا كود
                      </div>
                    )}
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="glass-soft flex w-16 items-center justify-center gap-1 rounded-2xl px-4 py-3">
                  <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-cyan-300" />
                  <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-cyan-300 [animation-delay:0.2s]" />
                  <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-cyan-300 [animation-delay:0.4s]" />
                </div>
              )}
            </div>

            {/* اقتراحات */}
            {messages.length <= 1 && (
              <div className="flex flex-wrap gap-2 px-4 pb-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="glass-soft rounded-full px-3 py-1.5 text-[11px] font-bold text-cyan-200 transition hover:border-cyan-400/50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* الإدخال */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="flex items-center gap-2 border-t border-white/10 p-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="اكتب سؤالك هنا..."
                className="field flex-1 !rounded-xl !py-2.5 text-sm"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="btn-primary flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white disabled:opacity-50"
                aria-label="إرسال"
              >
                {loading ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <SendHorizonal size={17} className="-scale-x-100" />
                )}
              </button>
            </form>
            <div className="bg-white/[0.03] px-4 py-2 text-center text-[10px] text-ink-dim">
              يرد عليك وكلاء نوفا كود الأذكياء — يعملون محلياً عبر Ollama، وتشرف الإدارة على الجودة
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
