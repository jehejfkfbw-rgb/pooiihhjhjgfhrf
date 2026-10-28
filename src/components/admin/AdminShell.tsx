"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Inbox,
  Code2,
  Megaphone,
  MessagesSquare,
  UsersRound,
  LogOut,
  CheckCircle2,
  XCircle,
  Loader2,
  Cpu,
  ChevronDown,
  RefreshCw,
  Phone,
  CalendarDays,
  CircleDollarSign,
  Bot,
} from "lucide-react";
import { AGENTS } from "@/lib/agents";
import { NovaMark } from "@/components/site/Logo";
import { TeamPanel } from "./TeamPanel";
import type {
  OrderRow,
  DevTaskRow,
  MarketingRow,
  ChatRow,
  StatusKey,
  StaffRow,
  AssignmentRow,
} from "@/lib/site";

type Tab = "overview" | "orders" | "dev" | "marketing" | "team" | "chats";

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: "overview", label: "نظرة عامة", icon: LayoutDashboard },
  { id: "orders", label: "طلبات العملاء", icon: Inbox },
  { id: "dev", label: "فريق التطوير", icon: Code2 },
  { id: "marketing", label: "التسويق", icon: Megaphone },
  { id: "team", label: "فريق العمل والمهام", icon: UsersRound },
  { id: "chats", label: "المحادثات", icon: MessagesSquare },
];

const STATUS_META: Record<StatusKey, { label: string; cls: string }> = {
  new: { label: "جديد", cls: "bg-cyan-400/10 text-cyan-300 border-cyan-400/30" },
  pending: { label: "بانتظار اعتمادك", cls: "bg-amber-400/10 text-amber-300 border-amber-400/30" },
  approved: { label: "معتمد", cls: "bg-emerald-400/10 text-emerald-300 border-emerald-400/30" },
  rejected: { label: "مرفوض", cls: "bg-rose-400/10 text-rose-300 border-rose-400/30" },
};

function StatusChip({ status }: { status: StatusKey }) {
  const m = STATUS_META[status];
  return (
    <span className={`rounded-full border px-3 py-1 text-[11px] font-bold ${m.cls}`}>
      {m.label}
    </span>
  );
}

function fmtDate(iso: string) {
  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function AdminShell({
  orders,
  devTasks,
  marketing,
  chats,
  staff,
  assignments,
}: {
  orders: OrderRow[];
  devTasks: DevTaskRow[];
  marketing: MarketingRow[];
  chats: ChatRow[];
  staff: StaffRow[];
  assignments: AssignmentRow[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [ollama, setOllama] = useState<{ online: boolean; model: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/ollama")
      .then((r) => (r.ok ? r.json() : null))
      .then(setOllama)
      .catch(() => setOllama({ online: false, model: "llama3.2:3b" }));
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const newOrders = useMemo(() => orders.filter((o) => o.status === "new"), [orders]);
  const pendingTasks = useMemo(() => devTasks.filter((t) => t.status === "pending"), [devTasks]);
  const pendingMarketing = useMemo(() => marketing.filter((m) => m.status === "pending"), [marketing]);
  const pendingTeam = useMemo(
    () => assignments.filter((a) => a.status === "submitted" || a.status === "assigned"),
    [assignments],
  );
  const approvedOrders = useMemo(() => orders.filter((o) => o.status === "approved"), [orders]);

  async function call(url: string, init?: RequestInit, key?: string, done?: string) {
    if (key) setBusy(key);
    try {
      const res = await fetch(url, {
        headers: { "Content-Type": "application/json" },
        ...init,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "فشل الإجراء");
      if (done) setToast(done);
      router.refresh();
      return data;
    } catch (e) {
      setToast(e instanceof Error ? e.message : "حدث خطأ");
      return null;
    } finally {
      if (key) setBusy(null);
    }
  }

  const actOrder = (id: number, action: "approve" | "reject") =>
    call(`/api/admin/orders/${id}`, { method: "PATCH", body: JSON.stringify({ action }) }, `o-${id}`,
      action === "approve" ? "تم اعتماد طلب العميل" : "تم رفض الطلب");

  const actTask = (id: number, action: "approve" | "reject") =>
    call(`/api/admin/dev/${id}`, { method: "PATCH", body: JSON.stringify({ action }) }, `t-${id}`,
      action === "approve" ? "تم اعتماد المقترح — يمكن تسليمه للعميل الآن" : "تم رفض المقترح");

  const runDev = async (id: number) => {
    const data = await call("/api/admin/dev/run", { method: "POST", body: JSON.stringify({ taskId: id }) }, `run-${id}`);
    if (data) setToast(data.via === "ollama" ? "فريق التطوير أنهى المقترح عبر Ollama" : "تم تجهيز المقترح (النظام البديل — Ollama غير متصل)");
  };

  const actMarketing = (id: number, action: "approve" | "reject") =>
    call(`/api/admin/marketing/${id}`, { method: "PATCH", body: JSON.stringify({ action }) }, `m-${id}`,
      action === "approve" ? "تم اعتماد المحتوى للنشر" : "تم رفض المحتوى");

  async function generateMarketing(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const topic = String(fd.get("topic") ?? "");
    const platform = String(fd.get("platform") ?? "تيك توك");
    const data = await call("/api/admin/marketing/run", {
      method: "POST",
      body: JSON.stringify({ topic, platform }),
    }, "gen-m");
    if (data) setToast(data.via === "ollama" ? "أنتج مروان ودانا المحتوى عبر Ollama" : "تم إنتاج المحتوى (النظام البديل — Ollama غير متصل)");
    (e.target as HTMLFormElement).reset();
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/nova-ctrl-9x82");
    router.refresh();
  }

  return (
    <div className="min-h-screen">
      {/* شريط علوي */}
      <header className="glass sticky top-0 z-30 border-b border-nova-line">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-3">
            <NovaMark size={32} />
            <div>
              <div className="font-display text-sm font-black text-white">لوحة تحكم نوفا كود</div>
              <div className="text-[10px] text-ink-dim">وصول مدير النظام — سرّي ومحمي</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`hidden items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-bold sm:flex ${
                ollama?.online
                  ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                  : "border-amber-400/30 bg-amber-400/10 text-amber-300"
              }`}
            >
              <Cpu size={13} />
              {ollama === null
                ? "فحص Ollama..."
                : ollama.online
                  ? `Ollama متصل (${ollama.model})`
                  : "Ollama غير متصل — وضع المحاكاة"}
            </span>
            <button
              onClick={() => router.refresh()}
              className="glass-soft rounded-xl p-2.5 text-ink-dim transition hover:text-white"
              aria-label="تحديث"
            >
              <RefreshCw size={16} />
            </button>
            <button
              onClick={logout}
              className="glass-soft flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-rose-300 transition hover:border-rose-400/40"
            >
              <LogOut size={14} />
              خروج
            </button>
          </div>
        </div>
      </header>

      {/* تبويبات */}
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <nav className="mt-6 flex gap-2 overflow-x-auto pb-1">
          {TABS.map((t) => {
            const active = tab === t.id;
            const badge =
              t.id === "orders"
                ? newOrders.length
                : t.id === "dev"
                  ? pendingTasks.length
                  : t.id === "marketing"
                    ? pendingMarketing.length
                    : t.id === "team"
                      ? pendingTeam.length
                      : 0;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`relative flex shrink-0 items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition ${
                  active
                    ? "bg-gradient-to-l from-violet-600 to-cyan-600 text-white shadow-lg"
                    : "glass-soft text-ink-dim hover:text-white"
                }`}
              >
                <t.icon size={16} />
                {t.label}
                {badge > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white">
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <main className="pb-24 pt-8">
          {/* ============ نظرة عامة ============ */}
          {tab === "overview" && (
            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {[
                  { label: "طلبات جديدة", value: newOrders.length, tone: "text-cyan-300" },
                  { label: "بانتظار اعتمادك", value: pendingTasks.length + pendingMarketing.length, tone: "text-amber-300" },
                  { label: "طلبات معتمدة", value: approvedOrders.length, tone: "text-emerald-300" },
                  { label: "إجمالي الطلبات", value: orders.length, tone: "text-violet-300" },
                ].map((k) => (
                  <div key={k.label} className="glass rounded-3xl p-6">
                    <div className={`font-display text-4xl font-black ${k.tone}`}>{k.value}</div>
                    <div className="mt-2 text-xs font-bold text-ink-dim">{k.label}</div>
                  </div>
                ))}
              </div>

              <div className="glass rounded-[2rem] p-6">
                <h2 className="font-display flex items-center gap-2 text-base font-black text-white">
                  <UsersRound size={18} className="text-cyan-300" />
                  فريقك البشري وبوابة التنفيذ
                </h2>
                <p className="mt-1.5 text-xs leading-relaxed text-ink-dim">
                  أنت المطور والمدير: تُسند الشغل من هنا، والموظف ينفّذه في بوابة الفريق ثم يعود
                  إليك للاعتماد. رابط لوحة المطور لا يعرفه أحد غيرك، ورابط بوابة الموظفين موجود في
                  تبويب «فريق العمل والمهام».
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="glass-soft rounded-2xl p-4">
                    <div className="font-display text-2xl font-black text-cyan-300">{staff.length}</div>
                    <div className="mt-1 text-[11px] text-ink-dim">موظفون مسجلون</div>
                  </div>
                  <div className="glass-soft rounded-2xl p-4">
                    <div className="font-display text-2xl font-black text-amber-300">
                      {assignments.filter((a) => a.status === "in_progress").length}
                    </div>
                    <div className="mt-1 text-[11px] text-ink-dim">قيد التنفيذ الآن</div>
                  </div>
                  <button
                    onClick={() => setTab("team")}
                    className="glass-soft rounded-2xl p-4 text-start transition hover:border-cyan-400/40"
                  >
                    <div className="font-display text-2xl font-black text-violet-300">
                      {assignments.filter((a) => a.status === "submitted").length}
                    </div>
                    <div className="mt-1 text-[11px] text-ink-dim">بانتظار اعتمادك — افتح القسم</div>
                  </button>
                </div>
              </div>

              <div className="glass-soft rounded-[2rem] p-7">
                <h2 className="font-display text-lg font-black text-white">حالة الفريق الذكي</h2>
                <p className="mt-1 text-xs text-ink-dim">
                  جميع الوكلاء يعملون محلياً عبر Ollama على جهازك — ولا يُعتمد أي من مخرجاتهم دون موافقتك.
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {AGENTS.map((a) => (
                    <div key={a.id} className="glass rounded-2xl p-4">
                      <div className="flex items-center gap-3">
                        <span className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${a.tint} font-display text-base font-black text-white`}>
                          {a.name[0]}
                        </span>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-black text-white">{a.name}</div>
                          <div className="truncate text-[10px] text-ink-dim">{a.role}</div>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-[10px]">
                        <span className="text-ink-dim">{a.teamLabel}</span>
                        <span className="flex items-center gap-1 font-bold text-emerald-300">
                          <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-emerald-400" />
                          جاهز
                        </span>
                      </div>
                    </div>
                  ))}
                  <div className="glass rounded-2xl border-dashed p-4">
                    <div className="flex h-full flex-col items-center justify-center text-center">
                      <Bot size={20} className="text-violet-300" />
                      <p className="mt-2 text-[11px] leading-relaxed text-ink-dim">
                        المدير (أنت) هو الفلتر النهائي — لا تسليم ولا نشر دون اعتمادك.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============ فريق العمل ============ */}
          {tab === "team" && (
            <TeamPanel staff={staff} assignments={assignments} orders={orders} />
          )}

          {/* ============ طلبات العملاء ============ */}
          {tab === "orders" && (
            <div className="space-y-4">
              {orders.length === 0 && (
                <EmptyState text="لا توجد طلبات بعد — عندما يملأ زائر نموذج (اطلب مشروعك) سيظهر هنا فوراً." />
              )}
              {orders.map((o) => (
                <article key={o.id} className="glass rounded-3xl p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="font-display text-lg font-black text-white">{o.clientName}</h3>
                        <StatusChip status={o.status} />
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-ink-dim">
                        <span className="flex items-center gap-1.5" dir="ltr">
                          <Phone size={12} /> {o.phone}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <CalendarDays size={12} /> {fmtDate(o.createdAt)}
                        </span>
                        {o.budget && (
                          <span className="flex items-center gap-1.5">
                            <CircleDollarSign size={12} /> {o.budget}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="rounded-xl bg-violet-500/15 px-4 py-2 text-xs font-bold text-violet-200">
                      {o.service}
                    </span>
                  </div>
                  <p className="glass-soft mt-4 whitespace-pre-line rounded-2xl p-4 text-sm leading-relaxed text-ink">
                    {o.details}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      disabled={busy !== null || o.status === "approved"}
                      onClick={() => actOrder(o.id, "approve")}
                      className="flex items-center gap-2 rounded-xl bg-emerald-500/15 px-5 py-2.5 text-xs font-black text-emerald-300 transition hover:bg-emerald-500/25 disabled:opacity-40"
                    >
                      {busy === `o-${o.id}` ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                      اعتماد الطلب
                    </button>
                    <button
                      disabled={busy !== null || o.status === "rejected"}
                      onClick={() => actOrder(o.id, "reject")}
                      className="flex items-center gap-2 rounded-xl bg-rose-500/15 px-5 py-2.5 text-xs font-black text-rose-300 transition hover:bg-rose-500/25 disabled:opacity-40"
                    >
                      <XCircle size={14} />
                      رفض
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* ============ فريق التطوير ============ */}
          {tab === "dev" && (
            <div className="space-y-4">
              {devTasks.length === 0 && (
                <EmptyState text="لا توجد مهام تنفيذ بعد — تُنشأ تلقائياً مع كل طلب عميل جديد." />
              )}
              {devTasks.map((t) => {
                const linkedOrder = orders.find((o) => o.id === t.orderId);
                return (
                  <article key={t.id} className="glass rounded-3xl p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/40 to-cyan-500/20 text-cyan-200">
                          <Code2 size={18} />
                        </span>
                        <div>
                          <h3 className="font-display text-sm font-black text-white">{t.title}</h3>
                          <p className="text-[11px] text-ink-dim">كريم + سارة + عمر — {fmtDate(t.createdAt)}</p>
                        </div>
                      </div>
                      <StatusChip status={t.content ? t.status : "new"} />
                    </div>

                    {linkedOrder && (
                      <p className="mt-3 rounded-xl bg-white/[0.04] px-4 py-2.5 text-xs text-ink-dim">
                        مرتبط بطلب العميل: <span className="font-bold text-white">{linkedOrder.clientName}</span> — {linkedOrder.service}
                      </p>
                    )}

                    {!t.content ? (
                      <div className="mt-4 rounded-2xl border border-dashed border-violet-400/30 bg-violet-500/5 p-5 text-center">
                        <p className="text-xs text-ink-dim">
                          الفريق لم يركّب المقترح بعد — شغّل الوكلاء الثلاثة لتحليل طلب العميل وتجهيز خطة التنفيذ.
                        </p>
                        <button
                          disabled={busy !== null}
                          onClick={() => runDev(t.id)}
                          className="btn-primary mx-auto mt-4 flex items-center gap-2 rounded-xl px-6 py-3 text-xs font-black text-white disabled:opacity-50"
                        >
                          {busy === `run-${t.id}` ? (
                            <>
                              <Loader2 size={14} className="animate-spin" />
                              كريم وسارة وعمر يعملون الآن...
                            </>
                          ) : (
                            <>
                              <Cpu size={14} />
                              تشغيل فريق التطوير على هذا الطلب
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <>
                        <details className="group mt-4">
                          <summary className="glass-soft flex cursor-pointer list-none items-center justify-between rounded-2xl px-5 py-3.5 text-xs font-bold text-cyan-200">
                            مراجعة مقترح الفريق قبل الاعتماد
                            <ChevronDown size={15} className="transition group-open:rotate-180" />
                          </summary>
                          <pre className="max-h-[420px] overflow-y-auto whitespace-pre-wrap rounded-b-2xl border border-t-0 border-white/10 bg-nova-950/70 p-5 font-sans text-[13px] leading-relaxed text-ink">
                            {t.content}
                          </pre>
                        </details>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            disabled={busy !== null || t.status === "approved"}
                            onClick={() => actTask(t.id, "approve")}
                            className="flex items-center gap-2 rounded-xl bg-emerald-500/15 px-5 py-2.5 text-xs font-black text-emerald-300 transition hover:bg-emerald-500/25 disabled:opacity-40"
                          >
                            {busy === `t-${t.id}` ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                            اعتماد المقترح وتسليمه
                          </button>
                          <button
                            disabled={busy !== null || t.status === "rejected"}
                            onClick={() => actTask(t.id, "reject")}
                            className="flex items-center gap-2 rounded-xl bg-rose-500/15 px-4 py-2.5 text-xs font-black text-rose-300 transition hover:bg-rose-500/25 disabled:opacity-40"
                          >
                            <XCircle size={14} /> رفض
                          </button>
                          <button
                            disabled={busy !== null}
                            onClick={() => runDev(t.id)}
                            className="glass-soft flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-ink-dim transition hover:text-white"
                          >
                            <RefreshCw size={13} /> إعادة التوليد
                          </button>
                        </div>
                      </>
                    )}
                  </article>
                );
              })}
            </div>
          )}

          {/* ============ التسويق ============ */}
          {tab === "marketing" && (
            <div className="space-y-6">
              <form onSubmit={generateMarketing} className="glass rounded-3xl p-6">
                <h3 className="font-display flex items-center gap-2 text-base font-black text-white">
                  <Megaphone size={18} className="text-fuchsia-300" />
                  توليد محتوى جديد — مروان (بوست) + دانا (سكريبت فيديو)
                </h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_200px_auto]">
                  <input name="topic" required className="field" placeholder="موضوع المحتوى — مثال: لماذا يحتاج مطعمك نظام طلبات خاصاً؟" />
                  <select name="platform" className="field" defaultValue="تيك توك">
                    <option>تيك توك</option>
                    <option>إنستغرام</option>
                    <option>فيسبوك</option>
                    <option>إكس (تويتر)</option>
                    <option>خطة محتوى أسبوعية</option>
                  </select>
                  <button
                    disabled={busy !== null}
                    className="btn-primary flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-xs font-black text-white disabled:opacity-50"
                  >
                    {busy === "gen-m" ? <Loader2 size={14} className="animate-spin" /> : <Cpu size={14} />}
                    {busy === "gen-m" ? "الفريق يكتب الآن..." : "ولّد المحتوى"}
                  </button>
                </div>
              </form>

              <div className="space-y-4">
                {marketing.length === 0 && (
                  <EmptyState text="لا يوجد محتوى تسويقي بعد — اكتب موضوعاً بالأعلى وسينتج مروان ودانا البوست والسكريبت فوراً." />
                )}
                {marketing.map((m) => (
                  <article key={m.id} className="glass rounded-3xl p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-fuchsia-500/15 px-3 py-1 text-[11px] font-bold text-fuchsia-200">{m.platform}</span>
                          <h3 className="text-sm font-black text-white">{m.topic}</h3>
                        </div>
                        <p className="mt-1.5 text-[11px] text-ink-dim">
                          بواسطة {m.agentName} — {fmtDate(m.createdAt)}
                        </p>
                      </div>
                      <StatusChip status={m.status} />
                    </div>
                    <details className="group mt-4">
                      <summary className="glass-soft flex cursor-pointer list-none items-center justify-between rounded-2xl px-5 py-3.5 text-xs font-bold text-fuchsia-200">
                        مراجعة المحتوى قبل اعتماد النشر
                        <ChevronDown size={15} className="transition group-open:rotate-180" />
                      </summary>
                      <pre className="max-h-[420px] overflow-y-auto whitespace-pre-wrap rounded-b-2xl border border-t-0 border-white/10 bg-nova-950/70 p-5 font-sans text-[13px] leading-relaxed text-ink">
                        {m.content}
                      </pre>
                    </details>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        disabled={busy !== null || m.status === "approved"}
                        onClick={() => actMarketing(m.id, "approve")}
                        className="flex items-center gap-2 rounded-xl bg-emerald-500/15 px-5 py-2.5 text-xs font-black text-emerald-300 transition hover:bg-emerald-500/25 disabled:opacity-40"
                      >
                        {busy === `m-${m.id}` ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                        اعتماد للنشر
                      </button>
                      <button
                        disabled={busy !== null || m.status === "rejected"}
                        onClick={() => actMarketing(m.id, "reject")}
                        className="flex items-center gap-2 rounded-xl bg-rose-500/15 px-4 py-2.5 text-xs font-black text-rose-300 transition hover:bg-rose-500/25 disabled:opacity-40"
                      >
                        <XCircle size={14} /> رفض
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          {/* ============ المحادثات ============ */}
          {tab === "chats" && (
            <div className="space-y-3">
              {chats.length === 0 && (
                <EmptyState text="لا توجد محادثات مسجلة بعد — ردود ليلى وفهد مع الزوار تُخزن هنا تلقائياً." />
              )}
              {chats.map((c) => (
                <div key={c.id} className="glass-soft flex gap-4 rounded-2xl p-4">
                  <span
                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black ${
                      c.role === "user" ? "bg-violet-500/20 text-violet-200" : "bg-cyan-500/15 text-cyan-200"
                    }`}
                  >
                    {c.role === "user" ? "زائر" : (c.agentName?.[0] ?? "ن")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-ink-dim">
                      <span className="font-bold text-white">
                        {c.role === "user" ? "زائر الموقع" : `${c.agentName} — خدمة العملاء`}
                      </span>
                      <span dir="ltr" className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[9px]">
                        {c.sessionId.slice(0, 8)}
                      </span>
                      <span>{fmtDate(c.createdAt)}</span>
                    </div>
                    <p className="mt-1.5 whitespace-pre-line text-[13px] leading-relaxed text-ink">
                      {c.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* إشعار */}
      {toast && (
        <div className="glass fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-2xl border-cyan-400/40 px-6 py-3.5 text-center text-sm font-bold text-cyan-200 shadow-2xl">
          {toast}
        </div>
      )}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="glass-soft rounded-3xl border-dashed p-12 text-center">
      <Inbox size={34} className="mx-auto text-ink-dim/50" />
      <p className="mx-auto mt-4 max-w-sm text-sm text-ink-dim">{text}</p>
    </div>
  );
}
