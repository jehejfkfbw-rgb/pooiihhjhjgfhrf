// ============================================================
// NOVA GEMINI BRIDGE — جسر اختياري لنموذج Gemini
// لو المتغيرات موجودة بيستخدم Gemini، ولو لأ بيرجع للمحرك المحلي.
// المحرك المحلي NOVA CORE مبيتمسحش أبداً — ده طبقة إضافية فوقه.
// (ملف سيرفر فقط — بيقرأ المفتاح من البيئة ومش بيوصل للمتصفح)
// ============================================================

import https from "node:https";

const GEMINI_KEY = process.env.GEMINI_API_KEY ?? "";
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-3.8-flash";
const GEMINI_BASE = process.env.GEMINI_BASE ?? "https://generativelanguage.googleapis.com";

export function geminiReady(): boolean {
  return Boolean(GEMINI_KEY && GEMINI_BASE);
}

export type GeminiResult = { ok: boolean; text: string; error?: string; ms: number };

/** POST خام عبر node:https مع فرض IPv4 — fetch العادي بيعلّق على IPv6 في بعض البيئات */
function postJson(
  url: string,
  headers: Record<string, string>,
  body: string,
  timeoutMs: number,
): Promise<{ status: number; text: string }> {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request(
      {
        hostname: u.hostname,
        port: 443,
        path: u.pathname + u.search,
        method: "POST",
        family: 4,
        timeout: timeoutMs,
        headers: { ...headers, "Content-Length": Buffer.byteLength(body) },
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => resolve({ status: res.statusCode ?? 0, text: data }));
      },
    );
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.on("error", (e) => reject(e));
    req.write(body);
    req.end();
  });
}

/**
 * استدعاء Gemini الحقيقي عبر Interactions API الجديد (المسار الرسمي للمفاتيح الجديدة).
 * الموديل بيفكر شوية فالرد بياخد وقت — timeout سخي 55 ثانية.
 */
export async function askGemini(prompt: string, _maxTokens = 1024): Promise<GeminiResult> {
  const t0 = Date.now();
  if (!geminiReady()) {
    return { ok: false, text: "", error: "GEMINI_API_KEY مش متسجل", ms: 0 };
  }
  try {
    const res = await postJson(
      `${GEMINI_BASE}/v1beta/interactions`,
      { "Content-Type": "application/json", "x-goog-api-key": GEMINI_KEY },
      JSON.stringify({ model: GEMINI_MODEL, input: prompt }),
      55000,
    );
    if (res.status !== 200) {
      return { ok: false, text: "", error: `HTTP ${res.status}: ${res.text.slice(0, 200)}`, ms: Date.now() - t0 };
    }
    const data = JSON.parse(res.text);
    const steps: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }> =
      Array.isArray(data?.steps) ? data.steps : [];
    const text = steps
      .filter((s) => s?.type === "model_output")
      .flatMap((s) => s.content ?? [])
      .map((c) => (typeof c?.text === "string" ? c.text : ""))
      .join("")
      .trim();
    if (!text) return { ok: false, text: "", error: "رد فاضي من Gemini", ms: Date.now() - t0 };
    return { ok: true, text, ms: Date.now() - t0 };
  } catch (e) {
    return { ok: false, text: "", error: String(e).slice(0, 200), ms: Date.now() - t0 };
  }
}

/** سؤال البوت: Gemini الأول لو جاهز، ولو فشل يرجع null والمحرك المحلي يكمل */
export async function geminiChat(message: string): Promise<string | null> {
  if (!geminiReady()) return null;
  const prompt =
    "أنت 'نورا'، المساعدة الذكية لشركة نوفا ديجيتال المصرية (مواقع، متاجر، تطبيقات، ذكاء اصطناعي).\n" +
    "رقم الشركة: 01503724381 — الإيميل: jehejfkfbw@gmail.com\n" +
    "رد باللهجة المصرية المصرية بشكل ودود ومختصر (3-6 أسطر).\n" +
    "لو السؤال عن أسعار: موقع 4999، متجر 11999، تطبيق 24999، نظام إدارة 14999، شات بوت 9999 ج.م.\n" +
    "سؤال العميل: " + message;
  const r = await askGemini(prompt, 512);
  return r.ok ? r.text : null;
}

/** توليد فكرة سوشيال ميديا — Gemini لو جاهز، ولو لأ مولّد محلي ذكي */
export type SocialIdea = {
  title: string;
  body: string;
  hashtags: string[];
  bestTime: string;
  platform: string;
  source: "gemini" | "local";
};

const LOCAL_IDEAS: Array<Omit<SocialIdea, "source">> = [
  {
    title: "قبل وبعد: موقع عميلنا في 30 ثانية",
    body: "فيديو قصير (Reel) بيورّي شكل البيزنس قبل ما يكون ليه موقع، وشكله بعد ما بنيناله موقع فخم. الناس بتحب التحول البصري — ده أقوى نوع محتوى للمبيعات.",
    hashtags: ["#تصميم_مواقع", "#بيزنس_أونلاين", "#نوفا_ديجيتال", "#مصر"],
    bestTime: "8 مساءً",
    platform: "Instagram Reels / TikTok",
  },
  {
    title: "غلطة الـ 5000 جنيه اللي بتضيع فلوسك",
    body: "بوست تعليمي: أكتر 3 غلطات أصحاب المحلات بيعملوها لما بيطلبوا موقع رخيص (استضافة بطيئة، مفيش دفع إلكتروني، مفيش SEO) — وازاي نتجنبها. المحتوى التعليمي بيجيب عملاء جاهزين.",
    hashtags: ["#تسويق_إلكتروني", "#متجر_إلكتروني", "#نصايح_بيزنس"],
    bestTime: "1 ظهراً",
    platform: "Facebook",
  },
  {
    title: "الذكاء الاصطناعي بيرد على عملائك بالمصري",
    body: "سكرين شوت حقيقي من بوت نوفا وهو بيرد على سؤال عميل باللهجة المصرية. الجمهور بيتفاعل جداً مع أي حاجة فيها AI شغال فعلاً مش كلام.",
    hashtags: ["#ذكاء_اصطناعي", "#شات_بوت", "#AI", "#تكنولوجيا"],
    bestTime: "9 مساءً",
    platform: "LinkedIn / Facebook",
  },
  {
    title: "قصة عميل: من فكرة على منديل لمتجر بيبيع",
    body: "Storytelling: احكي قصة عميل حقيقي من أول مكالمة واتساب لحد أول طلبية دخلت المتجر. القصص بتبني ثقة أكتر من أي إعلان.",
    hashtags: ["#قصص_نجاح", "#ريادة_أعمال", "#نوفا_ديجيتال"],
    bestTime: "7 مساءً",
    platform: "Facebook / Instagram",
  },
  {
    title: "تحدي الـ 7 أيام: موقعك جاهز ولا لأ؟",
    body: "سلسلة Stories يومية لمدة أسبوع: كل يوم سؤال تشخيصي للبيزنس (موقعك يفتح في ثانية؟ عندك دفع إلكتروني؟ جوجل بيلاقيك؟) — وفي النهاية CTA للاستشارة المجانية.",
    hashtags: ["#تحدي", "#بيزنس_أونلاين", "#مواقع"],
    bestTime: "10 صباحاً",
    platform: "Instagram Stories",
  },
  {
    title: "مقارنة صادقة: متجر واتساب vs متجر حقيقي",
    body: "كاروسيل (Carousel) بيوضح الفروق: الطلبات الضايعة، مفيش تقارير، مفيش دفع — مقابل متجر منظم بلوحة تحكم. المقارنات بتحوّل المتفرجين لعملاء.",
    hashtags: ["#متاجر_إلكترونية", "#فودافون_كاش", "#انستاباي"],
    bestTime: "6 مساءً",
    platform: "Instagram Carousel",
  },
  {
    title: "وراء الكواليس: الاستوديو الحي بيكتب كود",
    body: "فيديو من شاشة لوحة المطورين وإنت بتتفرج على NOVA FORGE وهو بيكتب كود مشروع عميل لايف. المحتوى ده بيوري إن شركتك بتشتغل بشفافية وتكنولوجيا حقيقية.",
    hashtags: ["#برمجة", "#BehindTheScenes", "#DevLife"],
    bestTime: "11 مساءً",
    platform: "TikTok / LinkedIn",
  },
];

export function localSocialIdea(dayIndex: number): SocialIdea {
  const base = LOCAL_IDEAS[dayIndex % LOCAL_IDEAS.length];
  return { ...base, source: "local" };
}

export async function geminiSocialIdea(dayIndex: number, niche = "شركة برمجيات مصرية"): Promise<SocialIdea | null> {
  if (!geminiReady()) return null;
  const prompt =
    `أنت مدير سوشيال ميديا محترف لشركة: ${niche}.\n` +
    "اعمل فكرة منشور واحدة جديدة ومختلفة لليوم ده. الرد لازم يكون JSON صالح فقط بدون أي نص إضافي، بالشكل:\n" +
    '{"title":"عنوان جذاب بالعربي","body":"محتوى المنشور 3-5 أسطر باللهجة المصرية","hashtags":["#هاشتاج1","#هاشتاج2","#هاشتاج3"],"bestTime":"أفضل وقت نشر","platform":"اسم المنصة"}';
  const r = await askGemini(prompt, 600);
  if (!r.ok) return null;
  try {
    const clean = r.text.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(clean);
    if (!parsed.title || !parsed.body) return null;
    return { ...parsed, source: "gemini" };
  } catch {
    return null;
  }
}
