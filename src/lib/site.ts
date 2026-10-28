// ============================================================
// Nova Code — بيانات الشركة والخدمات والأسعار (مصر × السعودية)
// ============================================================

export const COMPANY = {
  name: "NEBRAS AI",
  nameAr: "نبراس",
  tagline: "شركة برمجيات تعمل بذكاء اصطناعي حقيقي — من التحليل إلى التسليم",
  whatsappDisplay: "01503724381",
  whatsappIntl: "201503724381",
  email: "jehejfkfbw@gmail.com",
  markets: ["مصر", "السعودية"],
} as const;

export const WHATSAPP_LINK = `https://wa.me/${COMPANY.whatsappIntl}?text=${encodeURIComponent(
  "مرحباً نوفا كود، أريد الاستفسار عن خدماتكم وأسعاركم",
)}`;

export type Currency = "EGP" | "SAR";

export const CURRENCY_LABEL: Record<Currency, string> = {
  EGP: "ج.م",
  SAR: "ر.س",
};

export const CURRENCY_NAME: Record<Currency, string> = {
  EGP: "الجنيه المصري",
  SAR: "الريال السعودي",
};

export function formatPrice(value: number, currency: Currency): string {
  const locale = currency === "EGP" ? "ar-EG" : "ar-SA";
  return `${new Intl.NumberFormat(locale).format(value)} ${CURRENCY_LABEL[currency]}`;
}

export type ServiceIconKey =
  | "globe"
  | "smartphone"
  | "database"
  | "bot"
  | "palette"
  | "shield";

export interface ServiceDef {
  id: string;
  icon: ServiceIconKey;
  title: string;
  desc: string;
  price: Record<Currency, number>;
  unit?: string;
  features: string[];
}

export const SERVICES: ServiceDef[] = [
  {
    id: "web",
    icon: "globe",
    title: "مواقع ومتاجر إلكترونية",
    desc: "متجر أو موقع تعريفي سريع وآمن، مصمم للتحويل وليس للاستعراض فقط.",
    price: { EGP: 12000, SAR: 1800 },
    unit: "يبدأ من",
    features: [
      "متجر متكامل مع سلة ودفع أونلاين",
      "بوابات دفع مصر والسعودية (مدى / STC Pay / فودافون كاش)",
      "لوحة تحكم عربية كاملة",
    ],
  },
  {
    id: "mobile",
    icon: "smartphone",
    title: "تطبيقات الموبايل",
    desc: "تطبيق واحد يعمل على iOS و Android بأداء أصلي وتجربة سلسة.",
    price: { EGP: 25000, SAR: 3500 },
    unit: "يبدأ من",
    features: [
      "Flutter بتغطية المنصتين معاً",
      "إشعارات وخرائط ودفع مدمج",
      "رفع التطبيق على المتجرين",
    ],
  },
  {
    id: "erp",
    icon: "database",
    title: "أنظمة إدارة مخصصة ERP/CRM",
    desc: "أنظمة مبيعات ومخزون وموارد بشرية مصممة حول شغلك أنت بالضبط.",
    price: { EGP: 40000, SAR: 6000 },
    unit: "يبدأ من",
    features: [
      "صلاحيات وتقارير لحظية",
      "فوترة إلكترونية متوافقة محلياً",
      "ربط مع واتساب والبريد",
    ],
  },
  {
    id: "ai",
    icon: "bot",
    title: "حلول الذكاء الاصطناعي",
    desc: "شات بوتات ووكلاء أذكياء يردّون على عملائك وينفّذون المهام تلقائياً.",
    price: { EGP: 18000, SAR: 2700 },
    unit: "يبدأ من",
    features: [
      "شات بوت واتساب يفهم المصري والخليجي",
      "وكلاء محليون عبر Ollama بدون اشتراكات",
      "أتمتة الردود والطلبات",
    ],
  },
  {
    id: "design",
    icon: "palette",
    title: "تصميم UI/UX وهوية بصرية",
    desc: "واجهات عالمية بهوية عربية أصيلة — من الشعار حتى آخر بكسل.",
    price: { EGP: 6000, SAR: 900 },
    unit: "يبدأ من",
    features: [
      "هوية بصرية كاملة",
      "نماذج تفاعلية قبل التنفيذ",
      "دليل استخدام للعلامة",
    ],
  },
  {
    id: "care",
    icon: "shield",
    title: "استضافة وصيانة وأمان",
    desc: "حماية دورية ونسخ احتياطي ومراقبة، حتى تنام وأنت مطمئن.",
    price: { EGP: 3600, SAR: 550 },
    unit: "سنوياً من",
    features: [
      "شهادات SSL وتحديثات أمان",
      "نسخ احتياطي أسبوعي",
      "دعم فني عبر واتساب",
    ],
  },
];

export function servicesDigest(): string {
  // ملخص نصي يُستخدم داخل أوامر وكلاء الذكاء الاصطناعي
  return SERVICES.map(
    (s) =>
      `- ${s.title}: ${formatPrice(s.price.EGP, "EGP")} في مصر / ${formatPrice(
        s.price.SAR,
        "SAR",
      )} في السعودية (${s.unit ?? "يبدأ من"})`,
  ).join("\n");
}

// أنواع مشتركة مع الواجهات (قابلة للتسلسل)
export type StatusKey = "new" | "pending" | "approved" | "rejected";

export interface OrderRow {
  id: number;
  clientName: string;
  phone: string;
  service: string;
  budget: string | null;
  details: string;
  status: StatusKey;
  createdAt: string;
}

export interface DevTaskRow {
  id: number;
  orderId: number | null;
  title: string;
  content: string | null;
  status: StatusKey;
  createdAt: string;
}

export interface MarketingRow {
  id: number;
  agentName: string;
  platform: string;
  topic: string;
  content: string;
  status: StatusKey;
  createdAt: string;
}

export interface CsDirectiveRow {
  id: number;
  target: string;
  title: string;
  content: string;
  status: "active" | "paused";
  createdAt: string;
}

export interface ChatRow {
  id: number;
  sessionId: string;
  agentName: string | null;
  role: string;
  content: string;
  createdAt: string;
}
