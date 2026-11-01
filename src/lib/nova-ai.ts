// ============================================================
// NOVA CORE — محرك الذكاء الاصطناعي المحلي بتاع نوفا ديجيتال
// مفيش أي API خارجي.. كله شغال محليًا على قاعدة المعرفة
// ============================================================

export type KnowledgeRow = {
  id: number;
  category: string;
  patterns: string[];
  answer: string;
  active: boolean;
  priority: number;
  hits: number;
};

/** تطبيع النص العربي عشان المطابقة تبقى مرنة */
export function normalizeArabic(input: string): string {
  return input
    .toLowerCase()
    .replace(/[ً-ْٰ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[^\u0600-\u06FFa-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** اختيار أفضل رد من قاعدة المعرفة حسب نقاط التطابق */
export function matchKnowledge(
  rows: KnowledgeRow[],
  rawInput: string,
): { row: KnowledgeRow | null; score: number } {
  const input = normalizeArabic(rawInput);
  if (!input) return { row: null, score: 0 };

  let best: KnowledgeRow | null = null;
  let bestScore = 0;

  for (const row of rows) {
    if (!row.active) continue;
    let score = 0;
    for (const rawPattern of row.patterns) {
      const p = normalizeArabic(rawPattern);
      if (!p) continue;
      if (input === p) {
        score += 40 + p.length * 0.1;
      } else if (input.includes(p)) {
        const words = p.split(" ").length;
        score += 6 + words * 4 + p.length * 0.08;
      } else if (p.length >= 4 && p.includes(input) && input.length >= 4) {
        score += 2;
      }
    }
    score += row.priority * 0.5;
    if (score > bestScore) {
      bestScore = score;
      best = row;
    }
  }

  return { row: bestScore >= 6 ? best : null, score: bestScore };
}

/** الوقت الحالي بتوقيت القاهرة */
export function cairoNow(): { day: number; minutes: number; clock: string } {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Cairo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "short",
  });
  const parts = fmt.formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const dayMap: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };
  const hour = parseInt(get("hour") || "0", 10) % 24;
  const minute = parseInt(get("minute") || "0", 10);
  const day = dayMap[get("weekday")] ?? 0;
  return {
    day,
    minutes: hour * 60 + minute,
    clock: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
  };
}

/** هل الوقت الحالي جوه مواعيد شغل البوت؟ */
export function withinWindow(
  day: number,
  minutes: number,
  start: string,
  end: string,
  days: number[],
): boolean {
  if (!days.includes(day)) return false;
  const [sh, sm] = start.split(":").map((x) => parseInt(x, 10));
  const [eh, em] = end.split(":").map((x) => parseInt(x, 10));
  const s = (sh || 0) * 60 + (sm || 0);
  const e = (eh || 0) * 60 + (em || 0);
  if (s <= e) return minutes >= s && minutes < e;
  return minutes >= s || minutes < e; // شيفت بيعدي نص الليل
}

export const DAY_NAMES = [
  "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت",
];

/** ردود احتياطية لو السؤال مش متسجل — بتتبدل عشوائيًا */
export const FALLBACKS: string[] = [
  "سؤال جميل! علشان أديك رد دقيق 100% كلمنا على 01503724381 أو ابعتلنا واتساب وهنرد عليك فورًا.\n\nوتقدر كمان تسألني عن: الخدمات، الأسعار، مدة التنفيذ، مواعيد الشغل، طرق الدفع.",
  "السؤال ده محتاج تفاصيل أكتر من فريقنا البشري. تواصل معانا دلوقتي على 01503724381 (مكالمة أو واتساب) ومعاك مختص في دقايق.\n\nجرّب كمان تسألني عن أسعار المواقع أو المتاجر أو أنظمة الذكاء الاصطناعي.",
  "وصلني سؤالك، بس علشان متأكدش المعلومة أحولك على الفريق: 01503724381 أو على الإيميل jehejfkfbw@gmail.com\n\nأنا شاطر جدًا في أسئلة الخدمات والأسعار والمواعيد.. اسألني!",
  "دقيقة واحدة.. ده خارج قاعدة معرفتي الحالية، وفريق نوفا بيضيفلي ردود جديدة كل يوم.\n\nاستنفد وقتك واسألني عن: المشاريع اللي عملناها، باقات الأسعار، طرق الدفع، أو ابعتلنا واتساب على 01503724381.",
  "حابب أساعدك صح، فالأفضل تكلم مختص من نوفا ديجيتال على 01503724381 — الرد بياخد أقل من 5 دقايق في مواعيد العمل.\n\nولو سؤالك عن خدمة أو سعر معين، أنا جاهز!",
];

export function pickFallback(sessionSeed: string): string {
  let h = 0;
  for (let i = 0; i < sessionSeed.length; i++) {
    h = (h * 31 + sessionSeed.charCodeAt(i)) >>> 0;
  }
  return FALLBACKS[h % FALLBACKS.length];
}
