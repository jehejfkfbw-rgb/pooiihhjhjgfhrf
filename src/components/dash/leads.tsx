"use client";

import { useEffect, useState } from "react";
import { Phone, MessageCircle, RefreshCw } from "lucide-react";
import { api, Spinner, Empty } from "./ui";
import type { Notify } from "./shell";
import { timeAgo } from "@/lib/format";
import type { SiteLead } from "@/lib/types";

const STATUS_OPTS = [
  { v: "new", label: "جديدة", cls: "bg-violet-500/15 text-violet-300" },
  { v: "contacted", label: "تم التواصل", cls: "bg-cyan-500/15 text-cyan-300" },
  { v: "done", label: "مقفولة", cls: "bg-emerald-500/15 text-emerald-300" },
];

function waNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("2")) return digits;
  if (digits.startsWith("0")) return "2" + digits;
  return digits;
}

export default function Leads({ notify }: { notify: Notify }) {
  const [list, setList] = useState<SiteLead[] | null>(null);

  async function load() {
    const d = await api<{ leads: SiteLead[] }>("/api/leads");
    setList(d.leads);
  }

  useEffect(() => { load().catch(() => {}); }, []);

  async function setStatus(id: number, status: string) {
    await api("/api/leads", { method: "PATCH", body: JSON.stringify({ id, status }) });
    setList((l) => (l ?? []).map((x) => (x.id === id ? { ...x, status } : x)));
    notify("تم تحديث حالة الرسالة");
  }

  if (!list) return <Spinner />;

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm text-slate-400">رسائل نموذج التواصل في الموقع — {list.length} رسالة.</p>
        <button onClick={load} className="grid size-10 place-items-center rounded-xl bg-white/5 transition hover:bg-white/10" title="تحديث">
          <RefreshCw className="size-4" />
        </button>
      </div>

      {list.length === 0 ? <Empty text="لسه مفيش رسائل — أول ما عميل يملأ النموذج هتظهر هنا" /> : (
        <div className="grid gap-4 lg:grid-cols-2">
          {list.map((l) => {
            const st = STATUS_OPTS.find((s) => s.v === l.status) ?? STATUS_OPTS[0];
            return (
              <div key={l.id} className="glass rounded-2xl p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-black">{l.name}</h3>
                    <p className="mt-0.5 font-mono text-xs text-cyan-300" dir="ltr">{l.phone}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-black ${st.cls}`}>{st.label}</span>
                </div>

                {l.service && <p className="mt-3 rounded-lg bg-white/[0.04] px-3 py-1.5 text-[11px] font-bold text-violet-200 w-fit">{l.service}</p>}
                {l.message && <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-400">{l.message}</p>}

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/[0.06] pt-4">
                  <select
                    className="nova-input !w-auto !py-2 text-xs"
                    value={l.status}
                    onChange={(e) => setStatus(l.id, e.target.value)}
                  >
                    {STATUS_OPTS.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
                  </select>
                  {l.phone && (
                    <>
                      <a href={`tel:${l.phone}`} className="grid size-9 place-items-center rounded-xl bg-white/5 text-slate-300 transition hover:bg-emerald-500/20 hover:text-emerald-300" title="اتصال">
                        <Phone className="size-4" />
                      </a>
                      <a href={`https://wa.me/${waNumber(l.phone)}`} target="_blank" rel="noreferrer" className="grid size-9 place-items-center rounded-xl bg-white/5 text-slate-300 transition hover:bg-emerald-500/20 hover:text-emerald-300" title="واتساب">
                        <MessageCircle className="size-4" />
                      </a>
                    </>
                  )}
                  <span className="mr-auto text-[10px] text-slate-600">{timeAgo(l.createdAt)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
