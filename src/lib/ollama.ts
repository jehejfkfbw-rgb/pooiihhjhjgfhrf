// ============================================================
// طبقة الاتصال بـ Ollama (يعمل محلياً على جهازك)
// - OLLAMA_URL (افتراضي: http://localhost:11434)
// - OLLAMA_MODEL (افتراضي: llama3.2:3b)
// إذا لم يكن Ollama متاحاً يرجع null وتعمل "المحاكاة الذكية" بديلاً.
// ============================================================

const OLLAMA_URL = (
  process.env.OLLAMA_URL ?? "http://localhost:11434"
).replace(/\/$/, "");
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "llama3.2:3b";

export interface OllamaMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function ollamaChat(
  system: string,
  user: string,
  timeoutMs = 90_000,
): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: ctrl.signal,
      cache: "no-store",
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        stream: false,
        options: { temperature: 0.7, num_ctx: 4096 },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      message?: { content?: string };
    };
    const text = data?.message?.content?.trim();
    return text && text.length > 0 ? text : null;
  } catch {
    return null;
  }
}

export async function ollamaHealth(): Promise<{
  online: boolean;
  model: string;
  url: string;
}> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 3_000);
    const res = await fetch(`${OLLAMA_URL}/api/tags`, {
      signal: ctrl.signal,
      cache: "no-store",
    });
    clearTimeout(timer);
    return { online: res.ok, model: OLLAMA_MODEL, url: OLLAMA_URL };
  } catch {
    return { online: false, model: OLLAMA_MODEL, url: OLLAMA_URL };
  }
}
