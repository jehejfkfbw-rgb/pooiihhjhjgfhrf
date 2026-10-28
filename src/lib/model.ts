// ============================================================
// NEBRAS AI — طبقة موحدة للاتصال بمزودي النماذج
// - Ollama محلي (جهازك)
// - OpenAI-compatible API (مفتاح على الخادم فقط)
// لا تدّعي الاتصال بدون اختبار حقيقي — probeProviders تفحص فعلاً
// ============================================================

const OLLAMA_URL = (process.env.OLLAMA_URL ?? "http://localhost:11434").replace(/\/$/, "");
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "llama3.2:3b";

const OPENAI_KEY = process.env.OPENAI_API_KEY ?? "";
const OPENAI_URL = (process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, "");
const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

// أسعار تقريبية لكل مليون (prompt/completion) — null = غير متاح
const PRICING: Record<string, { p: number; c: number }> = {
  "gpt-4o-mini": { p: 0.15, c: 0.6 },
  "gpt-4o": { p: 2.5, c: 10 },
  "llama3.2:3b": { p: 0, c: 0 },
  "llama3.1:8b": { p: 0, c: 0 },
};

export interface ModelRequest {
  system: string;
  user: string;
  temperature?: number;
  timeoutMs?: number;
}

export interface ModelResult {
  text: string;
  provider: "ollama" | "openai-compatible";
  model: string;
  ok: boolean;
  durationMs: number;
  promptChars: number;
  completionChars: number;
  costUsd: number | null; // null = غير متاح
}

function costOf(provider: string, model: string, p: number, c: number): number | null {
  const price = PRICING[model];
  if (!price) return null;
  const usd = (p / 1_000_000) * price.p + (c / 1_000_000) * price.c;
  void provider;
  return Math.round(usd * 1_000_000) / 1_000_000;
}

async function callOllama(req: ModelRequest): Promise<ModelResult | null> {
  const start = Date.now();
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), req.timeoutMs ?? 90_000);
    const res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: ctrl.signal,
      cache: "no-store",
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        stream: false,
        options: { temperature: req.temperature ?? 0.7, num_ctx: 4096 },
        messages: [
          { role: "system", content: req.system },
          { role: "user", content: req.user },
        ],
      }),
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = (await res.json()) as { message?: { content?: string } };
    const text = data?.message?.content?.trim();
    if (!text) return null;
    return {
      text,
      provider: "ollama",
      model: OLLAMA_MODEL,
      ok: true,
      durationMs: Date.now() - start,
      promptChars: req.system.length + req.user.length,
      completionChars: text.length,
      costUsd: costOf("ollama", OLLAMA_MODEL, req.system.length + req.user.length, text.length),
    };
  } catch {
    return null;
  }
}

async function callOpenAI(req: ModelRequest): Promise<ModelResult | null> {
  if (!OPENAI_KEY) return null;
  const start = Date.now();
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), req.timeoutMs ?? 90_000);
    const res = await fetch(`${OPENAI_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      signal: ctrl.signal,
      cache: "no-store",
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature: req.temperature ?? 0.7,
        messages: [
          { role: "system", content: req.system },
          { role: "user", content: req.user },
        ],
      }),
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = data?.choices?.[0]?.message?.content?.trim();
    if (!text) return null;
    return {
      text,
      provider: "openai-compatible",
      model: OPENAI_MODEL,
      ok: true,
      durationMs: Date.now() - start,
      promptChars: req.system.length + req.user.length,
      completionChars: text.length,
      costUsd: costOf("openai", OPENAI_MODEL, req.system.length + req.user.length, text.length),
    };
  } catch {
    return null;
  }
}

/**
 * طلب حقيقي: يجرب Ollama أولاً (الأرخص)، ثم السحابة إذا كان المفتاح مضبوطاً.
 * يرجع null إذا لم يتوفر أي مزود → يستخدم المُنفِّذ المولّد المحلي.
 */
export async function askModel(req: ModelRequest): Promise<ModelResult | null> {
  const ollama = await callOllama(req);
  if (ollama) return ollama;
  const cloud = await callOpenAI(req);
  if (cloud) return cloud;
  return null;
}

export interface ProviderStatus {
  key: string;
  name: string;
  model: string;
  configured: boolean;
  online: boolean;
  detail: string;
}

/** فحص اتصال حقيقي — لا يُعتبر المزود متصلاً إلا بعد رد فعلي */
export async function probeProviders(): Promise<ProviderStatus[]> {
  const [ollamaUp, cloudUp] = await Promise.all([
    (async () => {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 3000);
        const r = await fetch(`${OLLAMA_URL}/api/tags`, { signal: ctrl.signal, cache: "no-store" });
        clearTimeout(t);
        return r.ok;
      } catch {
        return false;
      }
    })(),
    (async () => {
      if (!OPENAI_KEY) return false;
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 5000);
        const r = await fetch(`${OPENAI_URL}/models`, {
          headers: { Authorization: `Bearer ${OPENAI_KEY}` },
          signal: ctrl.signal,
          cache: "no-store",
        });
        clearTimeout(t);
        return r.ok;
      } catch {
        return false;
      }
    })(),
  ]);

  return [
    {
      key: "ollama",
      name: "Ollama — محلي على جهازك",
      model: OLLAMA_MODEL,
      configured: true,
      online: ollamaUp,
      detail: ollamaUp
        ? `متصل على ${OLLAMA_URL} بالنموذج ${OLLAMA_MODEL}`
        : `غير متصل على ${OLLAMA_URL} — شغّل: ollama serve ثم ollama pull ${OLLAMA_MODEL}`,
    },
    {
      key: "openai-compatible",
      name: "API سحابي (OpenAI-compatible)",
      model: OPENAI_MODEL,
      configured: !!OPENAI_KEY,
      online: cloudUp,
      detail: !OPENAI_KEY
        ? "غير مهيأ — أضف OPENAI_API_KEY (و اختياري OPENAI_BASE_URL / OPENAI_MODEL) في .env — المفتاح يبقى على الخادم"
        : cloudUp
          ? `متصل بالنموذج ${OPENAI_MODEL}`
          : "المفتاح مضبوط لكن الاختبار الفعلي فشل — راجع المفتاح أو الاتصال",
    },
  ];
}
