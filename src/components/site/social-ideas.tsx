"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Lightbulb, Copy, Clock, Share2, CheckCircle2, Sparkles } from "lucide-react";

type Idea = {
  id: number;
  day: string;
  title: string;
  body: string;
  hashtags: string[];
  bestTime: string;
  platform: string;
  source: string;
  published: boolean;
};

export default function SocialIdeas() {
  const [idea, setIdea] = useState<Idea | null>(null);
  const [copied, setCopied] = useState(false);
  const [published, setPublished] = useState(false);

  useEffect(() => {
    fetch("/api/social")
      .then((r) => r.json())
      .then((d) => { if (d.ok) { setIdea(d.idea); setPublished(Boolean(d.idea.published)); } })
      .catch(() => {});
  }, []);

  if (!idea) return null;

  const fullText = `${idea.title}\n\n${idea.body}\n\n${idea.hashtags.join(" ")}`;

  async function copy() {
    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function markPublished() {
    if (!idea) return;
    await fetch("/api/social", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: idea.id, published: true }),
    });
    setPublished(true);
  }

  return (
    <section className="relative py-24">
      <div className="absolute inset-x-0 top-0 mx-auto h-px max-w-5xl bg-gradient-to-l from-transparent via-amber-500/30 to-transparent" />
      <div className="mx-auto max-w-4xl px-5">
        <div className="text-center">
          <p className="font-mono text-xs font-bold tracking-[0.4em] text-amber-300">— DAILY IDEA —</p>
          <h2 className="mt-3 text-4xl font-black sm:text-5xl">
            فكرة منشور <span className="text-grad-gold">كل يوم</span> جاهزة للنشر
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-400">
            الذكاء الاصطناعي بيجهزلك فكرة محتوى جديدة يوميًا: عنوان، نص جاهز، هاشتاجات، وأفضل وقت نشر — انسخها وانشرها على طول.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass hover-glow mt-12 overflow-hidden rounded-3xl"
        >
          <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.07] bg-gradient-to-l from-amber-500/15 to-transparent px-6 py-4">
            <span className="grid size-11 place-items-center rounded-xl bg-amber-500/20">
              <Lightbulb className="size-5 text-amber-300" />
            </span>
            <div className="flex-1">
              <p className="font-mono text-[10px] tracking-widest text-amber-300/80">فكرة يوم {idea.day}</p>
              <h3 className="text-lg font-black">{idea.title}</h3>
            </div>
            <span className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-[10px] font-black text-slate-400">
              <Sparkles className="size-3 text-violet-300" />
              {idea.source === "gemini" ? "مولّدة بـ Gemini" : "مولّدة بمحرك نوفا"}
            </span>
          </div>

          <div className="p-6">
            <p className="whitespace-pre-line text-base leading-relaxed text-slate-300">{idea.body}</p>

            <div className="mt-5 flex flex-wrap gap-2">
              {idea.hashtags.map((h) => (
                <span key={h} className="rounded-full bg-violet-500/15 px-3 py-1 text-xs font-bold text-violet-200">{h}</span>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-white/[0.07] pt-5">
              <span className="flex items-center gap-2 rounded-xl bg-white/[0.04] px-4 py-2.5 text-xs font-bold text-slate-300">
                <Clock className="size-4 text-cyan-300" /> أفضل وقت: {idea.bestTime}
              </span>
              <span className="flex items-center gap-2 rounded-xl bg-white/[0.04] px-4 py-2.5 text-xs font-bold text-slate-300">
                <Share2 className="size-4 text-pink-300" /> المنصة: {idea.platform}
              </span>
              <div className="mr-auto flex gap-2">
                <button onClick={copy} className="flex items-center gap-2 rounded-xl bg-white/10 px-5 py-2.5 text-xs font-black transition hover:bg-white/15">
                  {copied ? <CheckCircle2 className="size-4 text-emerald-400" /> : <Copy className="size-4" />}
                  {copied ? "اتنسخت!" : "انسخ المنشور كامل"}
                </button>
                {!published && (
                  <button onClick={markPublished} className="btn-neon rounded-xl px-5 py-2.5 text-xs font-black text-white">
                    نشرت خلاص ✓
                  </button>
                )}
                {published && (
                  <span className="flex items-center gap-1.5 rounded-xl bg-emerald-500/15 px-4 py-2.5 text-xs font-black text-emerald-300">
                    <CheckCircle2 className="size-4" /> منشورة
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
