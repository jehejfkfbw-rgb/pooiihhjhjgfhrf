"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Hammer, FileCode2, CircleCheck, LoaderCircle, CircleDashed, Play,
  PackageCheck, RefreshCw, TerminalSquare, Bot,
} from "lucide-react";
import { api, Panel, Spinner } from "./ui";
import type { Notify } from "./shell";
import type { ForgeBuild } from "@/lib/forge";
import type { SiteOrder } from "@/lib/types";

export default function Forge({ notify }: { notify: Notify }) {
  const [orders, setOrders] = useState<SiteOrder[] | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [build, setBuild] = useState<ForgeBuild | null>(null);
  const [orderStatus, setOrderStatus] = useState("");
  const [fileIdx, setFileIdx] = useState(-1);
  const [linesShown, setLinesShown] = useState(0);
  const [doneFiles, setDoneFiles] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [building, setBuilding] = useState(false);
  const [built, setBuilt] = useState(false);
  const [delivering, setDelivering] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const codeRef = useRef<HTMLDivElement>(null);

  async function loadOrders() {
    const d = await api<{ orders: SiteOrder[] }>("/api/orders");
    setOrders(d.orders.filter((o) => !["new", "rejected"].includes(o.status)));
  }
  useEffect(() => { loadOrders().catch(() => {}); }, []);

  // حركة الكتابة الحية
  useEffect(() => {
    if (!building || !build) return;
    timerRef.current = setInterval(() => {
      setLinesShown((prev) => {
        const file = build.files[fileIdx];
        if (!file) return prev;
        if (prev + 3 >= file.lines.length) {
          // الملف خلص
          setLogs((l) => [...l, `✓ اكتمل ${file.path} — ${file.lines.length} سطر`]);
          if (fileIdx + 1 >= build.files.length) {
            clearInterval(timerRef.current!);
            setBuilding(false);
            setBuilt(true);
            setLogs((l) => [...l, "▸ البناء اكتمل ✓ المشروع جاهز لمراجعة الجودة والتسليم"]);
            notify("النواة خلصت بناء " + build.orderCode);
            return file.lines.length;
          }
          setFileIdx(fileIdx + 1);
          setDoneFiles((d) => d + 1);
          setLogs((l) => [...l, `▸ الوكيل بيكتب دلوقتي: ${build.files[fileIdx + 1].path}`]);
          return 0;
        }
        return prev + 3;
      });
    }, 60);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [building, build, fileIdx]);

  useEffect(() => {
    codeRef.current?.scrollTo({ top: codeRef.current.scrollHeight });
  }, [linesShown, fileIdx]);

  async function pick(id: number) {
    if (building) return;
    setSelected(id);
    setBuild(null);
    setBuilt(false);
    setLogs([]);
    const d = await api<{ build: ForgeBuild; status: string }>(`/api/forge?orderId=${id}`);
    setBuild(d.build);
    setOrderStatus(d.status);
    setFileIdx(-1);
    setLinesShown(0);
    setDoneFiles(0);
  }

  async function startBuild() {
    if (!selected || !build) return;
    // لو الطرد لسه مقبول بس — خده لمرحلة التنفيذ أوتوماتيك
    if (orderStatus === "accepted") {
      await api(`/api/orders/${selected}`, { method: "PUT", body: JSON.stringify({ action: "start" }) });
      setOrderStatus("inprogress");
      await loadOrders();
    }
    setLogs([...build.intro, `▸ الوكيل بيكتب دلوقتي: ${build.files[0].path}`]);
    setFileIdx(0);
    setLinesShown(0);
    setDoneFiles(0);
    setBuilt(false);
    setBuilding(true);
  }

  async function deliver() {
    if (!build || !selected) return;
    setDelivering(true);
    const content = build.files
      .map((f) => "// ========== " + f.path + " ==========\n" + f.lines.join("\n"))
      .join("\n\n\n");
    const d = await api<{ ok: boolean; error?: string }>(`/api/orders/${selected}`, {
      method: "PUT",
      body: JSON.stringify({ action: "deliver", deliverable: content, deliverableName: build.orderCode + "-full-project.txt" }),
    });
    setDelivering(false);
    if (!d.ok) return notify(d.error ?? "مشكلة");
    setOrderStatus("delivered");
    await loadOrders();
    notify("اتسلّم الكود للعميل — يقدر يحمله من صفحة التتبع");
  }

  const currentFile = build && fileIdx >= 0 ? build.files[Math.min(fileIdx, build.files.length - 1)] : null;
  const totalLines = useMemo(() => (build ? build.files.reduce((s, f) => s + f.lines.length, 0) : 0), [build]);
  const writtenLines = useMemo(() => {
    if (!build) return 0;
    let w = linesShown;
    for (let i = 0; i < Math.min(fileIdx, build.files.length); i++) w += build.files[i].lines.length;
    return w;
  }, [build, fileIdx, linesShown]);

  if (!orders) return <Spinner />;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-400">
          غرفة البناء الحية — شوف نواة نوفا وهي <b className="text-violet-300">بتكتب كود المشروع فعليًا</b> ملف بملف، وبعدين سلّمه للعميل بضغطة.
        </p>
        <button onClick={loadOrders} className="grid size-10 place-items-center rounded-xl bg-white/5 transition hover:bg-white/10" title="تحديث">
          <RefreshCw className="size-4" />
        </button>
      </div>

      <div className="grid gap-5 xl:grid-cols-4">
        {/* قائمة الطلبات الجاهزة للبناء */}
        <Panel title="طلبات قابلة للبناء" icon={<TerminalSquare className="size-4 text-cyan-300" />} sub="مقبول / قيد التنفيذ / مراجعة">
          {orders.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-500">مفيش طلبات — قبّل طلب من تاب الطلبات الأول</p>
          ) : (
            <ul className="space-y-2">
              {orders.map((o) => (
                <li key={o.id}>
                  <button
                    onClick={() => pick(o.id)}
                    className={`w-full rounded-xl px-4 py-3 text-right transition ${
                      selected === o.id ? "bg-violet-600/25 shadow-[inset_0_0_0_1px_rgba(139,92,246,0.5)]" : "bg-white/[0.03] hover:bg-white/[0.06]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-black text-cyan-300" dir="ltr">{o.code}</span>
                      {o.status === "delivered"
                        ? <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-black text-emerald-300">مسلّم</span>
                        : <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-black text-violet-300">{o.progress}%</span>}
                    </div>
                    <p className="mt-1 truncate text-xs font-bold text-slate-200">{o.serviceName}</p>
                    <p className="truncate text-[10px] text-slate-500">{o.name}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* الاستوديو */}
        <div className="space-y-4 xl:col-span-3">
          {!build ? (
            <div className="glass grid min-h-96 place-items-center rounded-2xl">
              <div className="text-center">
                <Hammer className="mx-auto size-12 text-violet-400/50" />
                <p className="mt-4 text-sm font-bold text-slate-400">اختار طلب من القايمة وشوف النواة بتبنيه لايف</p>
              </div>
            </div>
          ) : (
            <>
              {/* هيدر البناء */}
              <div className="glass flex flex-wrap items-center gap-4 rounded-2xl p-4">
                <div>
                  <p className="font-mono text-[10px] tracking-widest text-cyan-300" dir="ltr">{build.orderCode} · {build.stack}</p>
                  <h3 className="mt-0.5 font-black">{build.title} — {build.client}</h3>
                </div>
                <div className="mr-auto flex items-center gap-4">
                  <div className="w-40">
                    <div className="mb-1 flex justify-between text-[10px] font-bold text-slate-500">
                      <span>سطور مكتوبة</span>
                      <span className="font-mono">{writtenLines}/{totalLines}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                      <div className="h-full rounded-full bg-gradient-to-l from-violet-500 to-cyan-400 transition-all" style={{ width: `${totalLines ? (writtenLines / totalLines) * 100 : 0}%` }} />
                    </div>
                  </div>
                  {!built && !building && orderStatus !== "delivered" && (
                    <button onClick={startBuild} className="btn-neon flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-black text-white">
                      <Play className="size-4" /> ابدأ البناء
                    </button>
                  )}
                  {building && (
                    <span className="flex items-center gap-2 rounded-xl bg-violet-500/15 px-5 py-3 text-sm font-black text-violet-200">
                      <LoaderCircle className="size-4 animate-spin" /> النواة بتكتب...
                    </span>
                  )}
                  {(built || orderStatus === "delivered") && orderStatus !== "delivered" && (
                    <button onClick={deliver} disabled={delivering} className="flex items-center gap-2 rounded-xl bg-emerald-500/25 px-6 py-3 text-sm font-black text-emerald-200 transition hover:bg-emerald-500/35 disabled:opacity-50">
                      <PackageCheck className="size-4" /> {delivering ? "جاري التسليم..." : "اعتمد الكود وسلّمه للعميل"}
                    </button>
                  )}
                  {orderStatus === "delivered" && (
                    <span className="flex items-center gap-2 rounded-xl bg-emerald-500/15 px-5 py-3 text-sm font-black text-emerald-300">
                      <PackageCheck className="size-4" /> اتسلّم للعميل
                    </span>
                  )}
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-4">
                {/* شجرة الملفات */}
                <div className="glass rounded-2xl p-4">
                  <p className="mb-3 flex items-center gap-2 text-[11px] font-bold text-slate-500"><Bot className="size-3.5 text-violet-300" /> ملفات المشروع</p>
                  <ul className="space-y-2">
                    {build.files.map((f, i) => (
                      <li key={f.path} className={`flex items-center gap-2 rounded-lg px-3 py-2 font-mono text-[11px] transition ${i === fileIdx ? "bg-violet-500/15 text-violet-200" : "text-slate-400"}`} dir="ltr">
                        {i < doneFiles || built ? (
                          <CircleCheck className="size-3.5 shrink-0 text-emerald-400" />
                        ) : i === fileIdx ? (
                          <LoaderCircle className="size-3.5 shrink-0 animate-spin text-violet-300" />
                        ) : (
                          <CircleDashed className="size-3.5 shrink-0 text-slate-600" />
                        )}
                        <span className="truncate">{f.path}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* محرر الكود + الطرفية */}
                <div className="space-y-4 lg:col-span-3">
                  <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#05070f]">
                    <div className="flex items-center gap-2 border-b border-white/[0.07] bg-white/[0.03] px-4 py-2.5">
                      <span className="size-2.5 rounded-full bg-rose-500/70" />
                      <span className="size-2.5 rounded-full bg-amber-500/70" />
                      <span className="size-2.5 rounded-full bg-emerald-500/70" />
                      <span className="mr-2 flex items-center gap-1.5 font-mono text-[11px] text-slate-400" dir="ltr">
                        <FileCode2 className="size-3.5" /> {currentFile ? currentFile.path : "NOVA FORGE"}
                      </span>
                    </div>
                    <div ref={codeRef} className="h-72 overflow-y-auto p-5">
                      <pre className="font-mono text-[12px] leading-6 text-slate-300" dir="ltr">
                        {currentFile
                          ? currentFile.lines.slice(0, built ? currentFile.lines.length : linesShown).join("\n")
                          : "// اضغط (ابدأ البناء) وشوف السحر..."}
                        {building && <span className="anim-blink text-violet-400">▮</span>}
                      </pre>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/50 p-4">
                    <p className="mb-2 font-mono text-[10px] tracking-widest text-slate-600" dir="ltr">NOVA-CORE TERMINAL</p>
                    <div className="max-h-36 space-y-1 overflow-y-auto font-mono text-[11px] leading-5" dir="rtl">
                      {logs.map((l, i) => (
                        <motion.p key={i} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className={l.startsWith("✓") ? "text-emerald-300" : "text-cyan-300/90"}>
                          {l}
                        </motion.p>
                      ))}
                      {logs.length === 0 && <p className="text-slate-700">▸ في انتظار أوامر البناء...</p>}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
