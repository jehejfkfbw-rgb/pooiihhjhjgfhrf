"use client";

import { useEffect, useState } from "react";
import { Trash2, RefreshCw, User, Bot } from "lucide-react";
import { api, Spinner, Empty } from "./ui";
import type { Notify } from "./shell";
import { timeAgo } from "@/lib/format";
import type { SiteChat } from "@/lib/types";

export default function Chats({ notify }: { notify: Notify }) {
  const [list, setList] = useState<SiteChat[] | null>(null);
  const [filter, setFilter] = useState<"all" | "matched" | "unmatched">("all");

  async function load() {
    const d = await api<{ chats: SiteChat[] }>("/api/admin/chats");
    setList(d.chats);
  }

  useEffect(() => { load().catch(() => {}); }, []);

  async function clearAll() {
    if (!confirm("هتمسح كل سجل المحادثات؟")) return;
    await api("/api/admin/chats", { method: "DELETE" });
    await load();
    notify("اتمسح السجل بالكامل");
  }

  if (!list) return <Spinner />;
  const filtered = list.filter((c) => (filter === "all" ? true : filter === "matched" ? c.matched : !c.matched));

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          {([["all", "الكل"], ["matched", "اترد عليها"], ["unmatched", "من غير جواب"]] as const).map(([k, l]) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`rounded-full px-4 py-2 text-xs font-bold transition ${filter === k ? "bg-violet-600 text-white" : "bg-white/5 text-slate-400 hover:text-white"}`}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="mr-auto flex gap-2">
          <button onClick={load} className="grid size-10 place-items-center rounded-xl bg-white/5 transition hover:bg-white/10" title="تحديث">
            <RefreshCw className="size-4" />
          </button>
          <button onClick={clearAll} className="flex items-center gap-2 rounded-xl bg-rose-500/10 px-4 py-2 text-xs font-black text-rose-300 transition hover:bg-rose-500/20">
            <Trash2 className="size-4" /> مسح السجل
          </button>
        </div>
      </div>

      {filtered.length === 0 ? <Empty text="مفيش محادثات هنا" /> : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <div key={c.id} className="glass rounded-2xl p-4">
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                <span className={`rounded-full px-2.5 py-0.5 ${c.matched ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"}`}>
                  {c.matched ? "رد من قاعدة المعرفة" : "رد احتياطي"}
                </span>
                {!c.inHours && <span className="rounded-full bg-cyan-500/15 px-2.5 py-0.5 text-cyan-300">خارج المواعيد</span>}
                <span className="mr-auto">{timeAgo(c.createdAt)} · جلسة {c.sessionId.slice(0, 6)}</span>
              </div>
              <div className="mt-3 flex items-start gap-2.5">
                <User className="mt-0.5 size-4 shrink-0 text-violet-300" />
                <p className="text-sm font-black text-slate-100">{c.question}</p>
              </div>
              <div className="mt-2 flex items-start gap-2.5">
                <Bot className="mt-0.5 size-4 shrink-0 text-cyan-300" />
                <p className="whitespace-pre-line text-xs leading-relaxed text-slate-400">{c.answer}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
