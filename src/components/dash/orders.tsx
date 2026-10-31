"use client";

import { useEffect, useState } from "react";
import {
  RefreshCw, Phone, MessageCircle, ClipboardCheck, Play, FlaskConical,
  PackageCheck, XCircle, ChevronDown, Timer, Bot, StickyNote, Trash2, FileCode2,
} from "lucide-react";
import { api, Spinner, Empty } from "./ui";
import type { Notify } from "./shell";
import { arDate, egp, timeAgo } from "@/lib/format";
import type { SiteOrder } from "@/lib/types";

const STATUSES: Record<string, { label: string; cls: string }> = {
  new: { label: "جديد", cls: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  accepted: { label: "مقبول", cls: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30" },
  inprogress: { label: "قيد التنفيذ", cls: "bg-violet-500/15 text-violet-300 border-violet-500/30" },
  review: { label: "مراجعة الجودة", cls: "bg-blue-500/15 text-blue-300 border-blue-500/30" },
  delivered: { label: "تم التسليم", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  rejected: { label: "اعتذرنا", cls: "bg-rose-500/15 text-rose-300 border-rose-500/30" },
};

const FILTERS = [
  { key: "active", label: "النشطة" },
  { key: "new", label: "الجديدة" },
  { key: "delivered", label: "المسلّمة" },
  { key: "all", label: "الكل" },
];

function waNumber(phone: string) {
  const d = phone.replace(/\D/g, "");
  if (d.startsWith("2")) return d;
  if (d.startsWith("0")) return "2" + d;
  return d;
}

export default function Orders({ notify }: { notify: Notify }) {
  const [list, setList] = useState<SiteOrder[] | null>(null);
  const [filter, setFilter] = useState("active");
  const [openId, setOpenId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState("");
  const [codeName, setCodeName] = useState("");
  const [note, setNote] = useState("");
  const [prog, setProg] = useState(50);

  async function load() {
    const d = await api<{ orders: SiteOrder[] }>("/api/orders");
    setList(d.orders);
  }
  useEffect(() => { load().catch(() => {}); const t = setInterval(load, 15000); return () => clearInterval(t); }, []);

  async function act(id: number, action: string, extra?: Record<string, unknown>) {
    setBusy(true);
    const d = await api<{ ok: boolean; error?: string }>(`/api/orders/${id}`, {
      method: "PUT",
      body: JSON.stringify({ action, ...extra }),
    });
    setBusy(false);
    if (!d.ok) return notify(d.error ?? "حصلت مشكلة");
    await load();
    const msgs: Record<string, string> = {
      accept: "تم قبول الطلب — الذكاء الاصطناعي حدد تاريخ التسليم وعيّن الوكيل",
      start: "الطلب دخل التنفيذ",
      review: "الطلب في مراجعة الجودة",
      deliver: "تم التسليم! العميل يقدر يحمّل ملف الكود دلوقتي",
      reject: "تم الاعتذار عن الطلب",
      progress: "اتحدثت نسبة الإنجاز",
      note: "اتضافت الملاحظة",
    };
    notify(msgs[action] ?? "تم");
  }

  async function remove(id: number) {
    if (!confirm("تحذف الطلب ده نهائيًا؟")) return;
    await api(`/api/orders/${id}`, { method: "DELETE" });
    await load();
    notify("تم حذف الطلب");
  }

  if (!list) return <Spinner />;

  const filtered = list.filter((o) => {
    if (filter === "all") return true;
    if (filter === "new") return o.status === "new";
    if (filter === "delivered") return o.status === "delivered";
    return !["delivered", "rejected"].includes(o.status);
  });
  const newCount = list.filter((o) => o.status === "new").length;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <p className="text-sm text-slate-400">غرفة استقبال الطلبات — العميل يطلب من الموقع وأنت تنفذ من هنا.</p>
        {newCount > 0 && (
          <span className="flex items-center gap-2 rounded-full bg-amber-500/15 px-4 py-1.5 text-xs font-black text-amber-300">
            <span className="size-1.5 rounded-full bg-amber-400 anim-pulse-dot" /> {newCount} طلب جديد مستني القبول
          </span>
        )}
        <div className="mr-auto flex gap-2">
          {FILTERS.map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`rounded-full px-4 py-2 text-xs font-bold transition ${filter === f.key ? "bg-violet-600 text-white" : "bg-white/5 text-slate-400 hover:text-white"}`}>
              {f.label}
            </button>
          ))}
          <button onClick={load} className="grid size-10 place-items-center rounded-xl bg-white/5 transition hover:bg-white/10" title="تحديث">
            <RefreshCw className="size-4" />
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Empty text="مفيش طلبات هنا — أول ما عميل يطلب خدمة من الموقع هتظهر هنا فورًا" />
      ) : (
        <div className="space-y-4">
          {filtered.map((o) => {
            const st = STATUSES[o.status] ?? STATUSES.new;
            const open = openId === o.id;
            return (
              <div key={o.id} className="glass rounded-2xl transition hover:border-violet-400/30">
                {/* السطر الرئيسي */}
                <button onClick={() => setOpenId(open ? null : o.id)} className="flex w-full flex-wrap items-center gap-4 p-5 text-right">
                  <span className="rounded-xl bg-white/[0.05] px-3 py-2 font-mono text-sm font-black text-cyan-300" dir="ltr">{o.code}</span>
                  <div className="min-w-44 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-black">{o.serviceName}</h3>
                      <span className={`rounded-full border px-3 py-0.5 text-[10px] font-black ${st.cls}`}>{st.label}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{o.name} · {o.phone} · {timeAgo(o.createdAt)}</p>
                  </div>
                  <div className="hidden w-40 sm:block">
                    <div className="mb-1 flex justify-between text-[10px] font-bold text-slate-500">
                      <span>الإنجاز</span><span className="font-mono">{o.progress}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                      <div className="h-full rounded-full bg-gradient-to-l from-violet-500 to-cyan-400 transition-all duration-700" style={{ width: `${o.progress}%` }} />
                    </div>
                  </div>
                  <span className="font-mono text-sm font-bold text-amber-300" dir="ltr">{egp(o.price)}</span>
                  <ChevronDown className={`size-4 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} />
                </button>

                {/* التفاصيل */}
                {open && (
                  <div className="border-t border-white/[0.06] px-5 pb-5 pt-4">
                    <div className="grid gap-4 lg:grid-cols-3">
                      {/* العميل + التواصل */}
                      <div className="space-y-3">
                        <div className="rounded-xl bg-white/[0.03] p-4">
                          <p className="text-[11px] font-bold text-slate-500">العميل</p>
                          <p className="mt-1 font-black">{o.name}</p>
                          <p className="font-mono text-xs text-cyan-300" dir="ltr">{o.phone}</p>
                          <div className="mt-3 flex gap-2">
                            <a href={`tel:${o.phone}`} className="grid size-9 place-items-center rounded-xl bg-white/5 transition hover:bg-emerald-500/20 hover:text-emerald-300"><Phone className="size-4" /></a>
                            <a href={`https://wa.me/${waNumber(o.phone)}?text=${encodeURIComponent(`أهلًا ${o.name}، معاك فريق نوفا ديجيتال بخصوص طلبك ${o.code}`)}`} target="_blank" rel="noreferrer" className="grid size-9 place-items-center rounded-xl bg-white/5 transition hover:bg-emerald-500/20 hover:text-emerald-300"><MessageCircle className="size-4" /></a>
                            <button onClick={() => remove(o.id)} className="grid size-9 place-items-center rounded-xl bg-white/5 transition hover:bg-rose-500/20 hover:text-rose-300"><Trash2 className="size-4" /></button>
                          </div>
                        </div>
                        {o.details && (
                          <div className="rounded-xl bg-white/[0.03] p-4">
                            <p className="text-[11px] font-bold text-slate-500">تفاصيل الطلب</p>
                            <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-slate-300">{o.details}</p>
                          </div>
                        )}
                        {o.assignee && (
                          <div className="flex items-center gap-2 rounded-xl bg-violet-500/[0.08] p-3 text-xs font-bold text-violet-200">
                            <Bot className="size-4" /> المسؤول عن التنفيذ: {o.assignee}
                          </div>
                        )}
                        {o.deadline && (
                          <div className="flex items-center gap-2 rounded-xl bg-cyan-500/[0.08] p-3 text-xs font-bold text-cyan-200">
                            <Timer className="size-4" /> التسليم المحدد: {arDate(o.deadline)}
                          </div>
                        )}
                      </div>

                      {/* الإجراءات */}
                      <div className="space-y-3 lg:col-span-2">
                        <div className="flex flex-wrap gap-2">
                          {o.status === "new" && (
                            <>
                              <ActionBtn busy={busy} onClick={() => act(o.id, "accept")} icon={<ClipboardCheck className="size-4" />} primary>قبول الطلب وتعيين وكيل</ActionBtn>
                              <ActionBtn busy={busy} onClick={() => act(o.id, "reject")} icon={<XCircle className="size-4" />} danger>اعتذار</ActionBtn>
                            </>
                          )}
                          {o.status === "accepted" && (
                            <ActionBtn busy={busy} onClick={() => act(o.id, "start")} icon={<Play className="size-4" />} primary>بدء التنفيذ</ActionBtn>
                          )}
                          {o.status === "inprogress" && (
                            <ActionBtn busy={busy} onClick={() => act(o.id, "review")} icon={<FlaskConical className="size-4" />} primary>إرسال لمراجعة الجودة</ActionBtn>
                          )}
                          {["inprogress", "review", "accepted"].includes(o.status) && (
                            <div className="flex w-full items-center gap-3 rounded-xl bg-white/[0.03] p-3">
                              <input type="range" min={10} max={99} value={prog} onChange={(e) => setProg(Number(e.target.value))} className="flex-1 accent-violet-500" dir="ltr" />
                              <span className="w-10 text-center font-mono text-xs font-bold text-violet-300">{prog}%</span>
                              <button disabled={busy} onClick={() => act(o.id, "progress", { progress: prog })} className="rounded-lg bg-white/10 px-3 py-1.5 text-[11px] font-black transition hover:bg-violet-500/30">حدّث</button>
                            </div>
                          )}
                        </div>

                        {/* تسليم ملف الكود */}
                        {["review", "inprogress"].includes(o.status) && (
                          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-4">
                            <p className="flex items-center gap-2 text-xs font-black text-emerald-300">
                              <FileCode2 className="size-4" /> التسليم النهائي — الصق ملف الكود الكامل
                            </p>
                            <input className="nova-input mt-3 !py-2 font-mono text-xs" placeholder="اسم الملف (مثال: nova-website.zip.txt)" value={codeName} onChange={(e) => setCodeName(e.target.value)} dir="ltr" />
                            <textarea className="nova-input mt-2 min-h-28 resize-y font-mono text-[11px]" dir="ltr" placeholder="<!-- الصق الكود كامل هنا -->" value={code} onChange={(e) => setCode(e.target.value)} />
                            <ActionBtn busy={busy} onClick={() => act(o.id, "deliver", { deliverable: code, deliverableName: codeName })} icon={<PackageCheck className="size-4" />} success>
                              تسليم الكود للعميل
                            </ActionBtn>
                          </div>
                        )}
                        {o.status === "delivered" && (
                          <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 p-3 text-xs font-bold text-emerald-300">
                            <PackageCheck className="size-4" /> اتسلّم بنجاح — الملف: <span className="font-mono" dir="ltr">{o.deliverableName || `${o.code}-source.txt`}</span>
                          </div>
                        )}

                        {/* ملاحظة */}
                        {!["delivered", "rejected"].includes(o.status) && (
                          <div className="flex gap-2">
                            <input className="nova-input flex-1 !py-2 text-xs" placeholder="اكتب ملاحظة بتظهر في تتبع العميل..." value={note} onChange={(e) => setNote(e.target.value)} />
                            <button disabled={busy || !note.trim()} onClick={() => { act(o.id, "note", { note }); setNote(""); }}
                              className="flex items-center gap-1.5 rounded-xl bg-white/10 px-4 text-[11px] font-black transition hover:bg-violet-500/30 disabled:opacity-40">
                              <StickyNote className="size-3.5" /> إضافة
                            </button>
                          </div>
                        )}

                        {/* خط زمني */}
                        <div className="rounded-xl bg-white/[0.03] p-4">
                          <p className="mb-2.5 text-[11px] font-bold text-slate-500">سجل الطلب</p>
                          <ul className="space-y-2">
                            {[...(o.events ?? [])].reverse().map((e, i) => (
                              <li key={i} className="flex items-start gap-2.5 text-xs">
                                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-cyan-400/70" />
                                <span className="flex-1 text-slate-300">{e.text}</span>
                                <span className="shrink-0 font-mono text-[10px] text-slate-600">{timeAgo(e.t)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ActionBtn({ children, onClick, icon, busy, primary = false, danger = false, success = false }: {
  children: React.ReactNode; onClick: () => void; icon: React.ReactNode; busy: boolean; primary?: boolean; danger?: boolean; success?: boolean;
}) {
  const cls = primary
    ? "btn-neon text-white"
    : danger
      ? "bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
      : success
        ? "bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30"
        : "bg-white/10 text-slate-200 hover:bg-white/15";
  return (
    <button disabled={busy} onClick={onClick} className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-black transition disabled:opacity-50 ${cls}`}>
      {icon}{children}
    </button>
  );
}
