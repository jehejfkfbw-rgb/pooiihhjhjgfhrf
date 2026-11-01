/** محرك الذكاء الاصطناعي المحلي - Nova Engine */

export function normalizeArabic(input: string): string {
  return input
    .toLowerCase()
    .replace(/[ً-ْ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\u0600-\u06FFa-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function matchKnowledge(rows: any[], rawInput: string) {
  const input = normalizeArabic(rawInput);
  let best = null;
  let bestScore = 0;

  for (const row of rows) {
    let score = 0;
    const patterns = Array.isArray(row.patterns) ? row.patterns : [];
    for (const p of patterns) {
      const normalizedP = normalizeArabic(p);
      if (input === normalizedP) score += 40;
      else if (input.includes(normalizedP)) score += 10;
    }
    score += (row.priority || 0);
    if (score > bestScore) {
      bestScore = score;
      best = row;
    }
  }
  return { row: bestScore >= 5 ? best : null, score: bestScore };
}

export function pickFallback() {
  const fallbacks = [
    "سؤال جميل! كلمنا على 01503724381 عشان ندردش في التفاصيل أكتر.",
    "مش متأكدة من النقطة دي بالظبط، بس فريقنا البشري يقدر يجاوبك فوراً على واتساب الشركة.",
    "أنا لسه بتعلم، ممكن تسألني عن الخدمات أو الأسعار؟"
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}
