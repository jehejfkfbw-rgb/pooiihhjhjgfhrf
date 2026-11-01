import { db, pool } from "@/db";
import { knowledge, settings, projects } from "@/db/schema";
import { sql } from "drizzle-orm";

const KB = [
  {
    category: "ترحيب",
    patterns: ["اهلا", "ازيك", "صباح الخير", "مساء الخير", "السلام عليكم", "هاي", "hi", "hello"],
    answer: "أهلاً بيك في نوفا ديجيتال! أنا نورا، المساعدة الذكية. أقدر أساعدك تعرف أسعارنا، خدماتنا، أو تتابع طلبك. تحب تبدأ بإيه؟",
    priority: 5
  },
  {
    category: "أسعار",
    patterns: ["بكام", "اسعار", "سعر", "تكلفة", "فلوس", "باقات", "عروض"],
    answer: "أسعارنا واضحة وبالجنيه المصري:\n- المواقع التعريفية: تبدأ من 4,999 ج.م\n- المتاجر الإلكترونية: تبدأ من 11,999 ج.م\n- تطبيقات الموبايل: تبدأ من 24,999 ج.م\nوعندنا باقات صيانة شهرية بتبدأ من 499 ج.م. تحب تفاصيل باقة معينة؟",
    priority: 4
  },
  {
    category: "خدمات",
    patterns: ["بتعملوا ايه", "خدمات", "موقع", "تطبيق", "ابلكيشن", "سيستم", "برمجة"],
    answer: "إحنا بنبني كل حاجة: مواقع شركات، متاجر، تطبيقات iOS و Android، وأنظمة إدارة (ERP). كل شغلنا محلي وبالكامل تحت سيطرتك.",
    priority: 4
  },
  {
    category: "تواصل",
    patterns: ["رقمكم", "تواصل", "واتساب", "تليفون", "عنوان", "كلمني"],
    answer: "تقدر تكلمنا واتساب أو مكالمة على 01503724381، أو تشرفنا في القاهرة. متاحين يومياً من 9 ص لـ 11 م.",
    priority: 3
  }
];

export async function ensureSeeded() {
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(knowledge);
  if (count > 0) return;

  await db.insert(knowledge).values(KB);
  await db.insert(settings).values([
    { key: "bot_status", value: "online" },
    { key: "security_level", value: "high" },
    { key: "lockdown_mode", value: "false" }
  ]);
  console.log("✅ Nova Core Seeded successfully.");
}
