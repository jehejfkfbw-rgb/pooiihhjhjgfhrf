import { COMPANY, SERVICES, formatPrice, servicesDigest } from "./site";
import { ollamaChat } from "./ollama";

// ============================================================
// فريق نوفا كود الذكي — 7 وكلاء يعملون محلياً عبر Ollama
// ============================================================

export type AgentTeam = "dev" | "cs" | "marketing";

export interface AgentDef {
  id: string;
  name: string;
  role: string;
  team: AgentTeam;
  teamLabel: string;
  tint: string; // لون مميز في الواجهة
  brief: string;
}

export const AGENTS: AgentDef[] = [
  // --- فريق التطوير والتنفيذ (3 مطورين) ---
  {
    id: "kareem",
    name: "كريم",
    role: "مطور Full-Stack — تحليل المتطلبات",
    team: "dev",
    teamLabel: "فريق التطوير والتنفيذ",
    tint: "from-violet-500 to-fuchsia-500",
    brief: "يحلل طلب العميل ويحوّله إلى نطاق عمل واضح ووحدات تنفيذية.",
  },
  {
    id: "sara",
    name: "سارة",
    role: "مهندسة واجهات — UI/Frontend",
    team: "dev",
    teamLabel: "فريق التطوير والتنفيذ",
    tint: "from-cyan-400 to-sky-500",
    brief: "تصمم خطة الواجهات وتجربة المستخدم وتختار تقنيات الواجهة.",
  },
  {
    id: "omar",
    name: "عمر",
    role: "مهندس Backend و DevOps",
    team: "dev",
    teamLabel: "فريق التطوير والتنفيذ",
    tint: "from-emerald-400 to-teal-500",
    brief: "يبني بنية قاعدة البيانات والخوادم والنشر وخطة الأمان.",
  },
  // --- فريق خدمة العملاء (موظفان) ---
  {
    id: "laila",
    name: "ليلى",
    role: "خدمة عملاء — السوق المصري",
    team: "cs",
    teamLabel: "فريق خدمة العملاء",
    tint: "from-rose-400 to-pink-500",
    brief: "ترد على الزوار المصريين وتشرح الخدمات والأسعار بالجنيه.",
  },
  {
    id: "fahd",
    name: "فهد",
    role: "خدمة عملاء — السوق السعودي",
    team: "cs",
    teamLabel: "فريق خدمة العملاء",
    tint: "from-amber-400 to-orange-500",
    brief: "يرد على الزوار السعوديين ويشرح الخدمات والأسعار بالريال.",
  },
  // --- فريق التسويق الإلكتروني (موظفان) ---
  {
    id: "marwan",
    name: "مروان",
    role: "صانع محتوى — سوشيال ميديا",
    team: "marketing",
    teamLabel: "فريق التسويق الإلكتروني",
    tint: "from-indigo-400 to-violet-500",
    brief: "يكتب بوستات فيسبوك وإنستغرام وخطط محتوى تجذب عملاء مصر والسعودية.",
  },
  {
    id: "dana",
    name: "دانا",
    role: "كاتبة سكريبتات — فيديو وإعلانات",
    team: "marketing",
    teamLabel: "فريق التسويق الإلكتروني",
    tint: "from-fuchsia-400 to-purple-500",
    brief: "تكتب سكريبتات تيك توك ونصوص الإعلانات الممولة بخطافات قوية.",
  },
];

export const TEAM_META: Record<
  AgentTeam,
  { label: string; desc: string }
> = {
  dev: {
    label: "فريق التطوير والتنفيذ",
    desc: "3 مطورين يجهزون مقترحات التنفيذ — لا يُعتمد أي طلب دون موافقة الإدارة.",
  },
  cs: {
    label: "فريق خدمة العملاء",
    desc: "موظفان يردّان على الزوار تلقائياً ويشرحان الأسعار بالعملتين.",
  },
  marketing: {
    label: "فريق التسويق الإلكتروني",
    desc: "موظفان لصناعة المحتوى: بوستات، وسكريبتات تيك توك وإعلانات.",
  },
};

// ------------------------------------------------------------
// أوامر النظام (System Prompts)
// ------------------------------------------------------------

const COMPANY_FACTS = `
أنت تعمل في شركة "Nova Code / نوفا كود" — استوديو برمجيات يخدم سوقين فقط: مصر والسعودية.
بيانات التواصل الرسمية (وجّه العميل إليها دائماً عند الجدية أو الطلب):
- واتساب: ${COMPANY.whatsappDisplay} (رابط: https://wa.me/${COMPANY.whatsappIntl})
- بريد إلكتروني: ${COMPANY.email}

الخدمات والأسعار الرسمية:
${servicesDigest()}

قواعد صارمة:
- لا تخترع أسعاراً أو خدمات غير المذكورة أعلاه.
- لا تقدّم وعوداً بتسليم قبل اعتماد الإدارة.
- رد باللغة العربية الواضحة (يجوز استخدام العامية المصرية أو الخليجية البسيطة حسب لهجة العميل).
- اجعل ردك مختصراً ومنظماً بنقاط، واختم بتوجيه العميل للواتساب عند رغبته في الطلب.
- لا تستخدم رموزاً تعبيرية (إيموجي) نهائياً.
`.trim();

function csSystem(agentName: string, marketHint: "EG" | "SA"): string {
  const focus =
    marketHint === "SA"
      ? "العميل غالباً من السعودية: اعرض الأسعار بالريال السعودي أولاً ثم اذكر الجنيه المصري اختصاراً."
      : "العميل غالباً من مصر: اعرض الأسعار بالجنيه المصري أولاً ثم اذكر الريال السعودي اختصاراً.";
  return `${COMPANY_FACTS}
اسمك "${agentName}" ودورك: خدمة عملاء نوفا كود.
${focus}
مهمتك: الترحيب بالزائر، فهم حاجته، شرح الخدمة المناسبة وسعرها، ثم توجيهه لإتمام الطلب عبر نموذج الموقع أو واتساب ${COMPANY.whatsappDisplay}.`;
}

const DEV_PROMPTS: Record<string, (order: string) => { system: string; user: string }> = {
  kareem: (order) => ({
    system: `${COMPANY_FACTS}
أنت "كريم"، مطور Full-Stack في نوفا كود. تحلل طلبات العملاء وتحولها إلى نطاق عمل احترافي قابل للتنفيذ.`,
    user: `حلل طلب العميل التالي واكتب قسم "تحليل المتطلبات ونطاق العمل":
- فهم المشروع في سطرين
- الوحدات الرئيسية المطلوبة (5-7 نقاط)
- الافتراضات والأسئلة المفتوحة للعميل (3 نقاط)
- المخاطر الفنية المحتملة (نقطتين)

الطلب:
${order}`,
  }),
  sara: (order) => ({
    system: `${COMPANY_FACTS}
أنتِ "سارة"، مهندسة واجهات في نوفا كود. تبنين خطط واجهات عربية RTL حديثة وسريعة.`,
    user: `بناءً على طلب العميل التالي، اكتب قسم "خطة الواجهات وتجربة المستخدم":
- هيكل الشاشات/الصفحات الأساسية (قائمة)
- التقنية المقترحة للواجهة ولماذا (سطرين)
- ملاحظات تجربة المستخدم للسوق المصري/السعودي (3 نقاط)

الطلب:
${order}`,
  }),
  omar: (order) => ({
    system: `${COMPANY_FACTS}
أنت "عمر"، مهندس Backend و DevOps في نوفا كود. تبني أنظمة آمنة قابلة للتوسع وتنشرها محلياً أو سحابياً.`,
    user: `بناءً على طلب العميل التالي، اكتب قسم "البنية الخلفية والنشر والجدول الزمني":
- قاعدة البيانات والخدمات الخلفية المقترحة (نقاط)
- خطة الاستضافة والأمان والنسخ الاحتياطي (نقاط)
- جدول زمني تقديري على مراحل (3-4 مراحل بمدد واقعية)
- ملاحظات تشغيل في مصر والسعودية (بوابات دفع، فوترة، إلخ)

الطلب:
${order}`,
  }),
};

const MARKETING_PROMPTS: Record<
  string,
  (topic: string, platform: string) => { system: string; user: string }
> = {
  marwan: (topic, platform) => ({
    system: `${COMPANY_FACTS}
أنت "مروان"، صانع محتوى سوشيال ميديا في نوفا كود. تكتب بوستات عربية جذابة تحوّل المتابعين لعملاء في مصر والسعودية.`,
    user: `اكتب بوست ${platform} احترافي عن: "${topic}".
المطلوب:
- عنوان خطافي قوي
- نص البوست (4-6 أسطر) يتحدث عن ألم العميل ثم الحل لدى نوفا كود
- إشارة للأسعار بعملتي مصر والسعودية عند الحاجة
- دعوة واضحة للتواصل: واتساب ${COMPANY.whatsappDisplay} أو البريد ${COMPANY.email}
- 8 هاشتاجات (خلط عربي/إنجليزي تستهدف #مصر #السعودية)`,
  }),
  dana: (topic, platform) => ({
    system: `${COMPANY_FACTS}
أنتِ "دانا"، كاتبة سكريبتات فيديو وإعلانات في نوفا كود. تكتبين سكريبتات تيك توك قصيرة عالية التحويل.`,
    user: `اكتبي سكريبت فيديو تيك توك (30-45 ثانية) عن: "${topic}" لمنصة ${platform}.
المطلوب:
- خطاف أول 3 ثوانٍ (جملة توقف التمرير)
- بنية الفيديو مشهداً بمشهد مع الزمن لكل مشهد
- نص التعليق الصوتي كاملاً بالعربية
- اقتراح نص يظهر على الشاشة
- خاتمة بدعوة للتواصل عبر واتساب ${COMPANY.whatsappDisplay}`,
  }),
};

// ------------------------------------------------------------
// الرّدود البديلة الذكية (تعمل فورياً عند غياب Ollama)
// ------------------------------------------------------------

function bothPrices(): string {
  return SERVICES.map(
    (s) =>
      `• ${s.title}: ${s.unit ?? "يبدأ من"} ${formatPrice(s.price.EGP, "EGP")} — أو ${formatPrice(s.price.SAR, "SAR")} لعملائنا في السعودية`,
  ).join("\n");
}

export function detectMarket(message: string): "EG" | "SA" {
  const sa = /السعودية|السعوديه|سعودي|الرياض|جدة|ر\.س|ريال|stc|مدى/i;
  return sa.test(message) ? "SA" : "EG";
}

export function pickCsAgent(market: "EG" | "SA"): AgentDef {
  return market === "SA" ? AGENTS[4] : AGENTS[3];
}

function fallbackCsReply(message: string, market: "EG" | "SA"): string {
  const m = message;
  const contact = `للطلب أو الاستفسار السريع: واتساب ${COMPANY.whatsappDisplay} — أو البريد ${COMPANY.email} وسنرد عليك في نفس اليوم.`;

  if (/سعر|أسعار|اسعار|بكام|تكلفة|تكلفه|فلوس|قيمة/.test(m)) {
    const head =
      market === "SA"
        ? `أهلاً بك من السعودية. هذه أسعارنا الرسمية بالريال ثم الجنيه:`
        : `أهلاً بك من مصر. هذه أسعارنا الرسمية بالجنيه ثم الريال لعملاء السعودية:`;
    return `${head}\n${bothPrices()}\nالسعر النهائي يتحدد بعد فهم تفاصيل مشروعك، ولا يُعتمد أي طلب إلا بموافقة الإدارة — لضمان الجودة.\n${contact}`;
  }
  if (/خدمة|خدمات|بتقدموا|بتعملوا|عندكم|متوفر/.test(m)) {
    return `خدمات نوفا كود الأساسية:\n${SERVICES.map((s) => `• ${s.title} — ${s.desc}`).join("\n")}\nاختر الخدمة الأقرب لاحتياجك وسأشرح لك التفاصيل والسعر فوراً.\n${contact}`;
  }
  if (/واتساب|تواصل|اتصل|رقم|ايميل|إيميل|بريد|ميل/.test(m)) {
    return `يسعدنا تواصلك معنا مباشرة:\n• واتساب: ${COMPANY.whatsappDisplay}\n• البريد: ${COMPANY.email}\nفريقنا يرد يومياً من 10 صباحاً حتى 12 منتصف الليل بتوقيت مصر والسعودية.`;
  }
  if (/تطبيق|موبايل|اندرويد|أندرويد|ايفون|آيفون|ios|android/i.test(m)) {
    const s = SERVICES[1];
    return `ممتاز، تطوير التطبيقات من أقوى خدماتنا:\n• ${s.features.join("\n• ")}\nالسعر ${s.unit}: ${formatPrice(s.price.EGP, "EGP")} في مصر أو ${formatPrice(s.price.SAR, "SAR")} في السعودية.\n${contact}`;
  }
  if (/متجر|موقع|تسويق الكتروني|اونلاين|أونلاين|سيلز|بيع/i.test(m)) {
    const s = SERVICES[0];
    return `نبني لك متجراً يبيع فعلاً:\n• ${s.features.join("\n• ")}\nالسعر ${s.unit}: ${formatPrice(s.price.EGP, "EGP")} في مصر أو ${formatPrice(s.price.SAR, "SAR")} في السعودية.\n${contact}`;
  }
  if (/ذكاء|بوت|شات|ai|اتمتة|أتمتة/i.test(m)) {
    const s = SERVICES[3];
    return `حلول الذكاء الاصطناعي لدينا تعمل محلياً بدون اشتراكات شهرية:\n• ${s.features.join("\n• ")}\nالسعر ${s.unit}: ${formatPrice(s.price.EGP, "EGP")} أو ${formatPrice(s.price.SAR, "SAR")}.\n${contact}`;
  }
  if (/طلب|اطلب|أطلب|ابدأ|أبدا|عايز|اريد|أريد|مشروع/i.test(m)) {
    return `خطوات طلب مشروعك من نوفا كود:\n1) املأ نموذج "اطلب مشروعك" في الموقع أو راسلنا واتساب.\n2) فريق التطوير الذكي يجهز مقترح التنفيذ.\n3) الإدارة تعتمد المقترح (شرط أساسي لدينا).\n4) نتواصل معك بالخطة والسعر النهائي ونبدأ التنفيذ.\n${contact}`;
  }
  return `أهلاً وسهلاً بك في نوفا كود — نخدم عملاءنا في مصر والسعودية فقط لنضمن جودة الدعم.\nأستطيع مساعدتك في:\n• شرح خدماتنا الست\n• عرض الأسعار بالجنيه المصري والريال السعودي\n• خطوات طلب مشروعك\n${contact}`;
}

// ------------------------------------------------------------
// مقترح فريق التطوير (بديل ذكي)
// ------------------------------------------------------------

function fallbackDevProposal(orderText: string, service: string): string {
  const svc = SERVICES.find((s) => service.includes(s.title)) ?? SERVICES[0];
  return `القسم الأول — تحليل المتطلبات ونطاق العمل (كريم)
• فهم المشروع: ${orderText.slice(0, 140)}
• الوحدات الرئيسية: واجهة العميل، لوحة تحكم عربية، إدارة المستخدمين والصلاحيات، نظام الطلبات/المحتوى، تقارير لحظية، إشعارات واتساب وبريد.
• الافتراضات: محتوى عربي أولاً، تصميم RTL كامل، تجربة موبايل أولى.
• أسئلة مفتوحة للعميل: عدد المستخدمين المتوقع؟ بوابات الدفع المفضلة؟ هل يوجد نظام حالي للربط معه؟
• المخاطر: تأخر تسليم المحتوى من العميل، وتغيّر المتطلبات بعد الاعتماد (يُدار بعقود تغيير واضحة).

القسم الثاني — خطة الواجهات وتجربة المستخدم (سارة)
• الشاشات الأساسية: الرئيسية، الخدمات/المنتجات، صفحة التفاصيل، السلة/الطلب، حساب المستخدم، لوحة الإدارة.
• التقنية المقترحة: Next.js + Tailwind لتجربة فائقة السرعة مع دعم RTL أصيل.
• ملاحظات السوق: أرقام أسعار واضحة بالعملة المحلية، زر واتساب ثابت، إثباتات ثقة أسفل كل صفحة.
• معيار القبول: سرعة تحميل أقل من ثانيتين على باقات مصر والسعودية الشائعة.

القسم الثالث — البنية الخلفية والنشر والجدول الزمني (عمر)
• قاعدة البيانات: PostgreSQL مع نسخ احتياطي أسبوعي آلي.
• الخدمات: API آمن، تخزين ملفات، تكامل واتساب للأعمال، بوابة دفع (${svc.id === "web" ? "مدى / STC Pay / فودافون كاش" : "حسب السوق"}).
• الأمان: SSL، تشفير كلمات المرور، صلاحيات دقيقة، سجل عمليات.
• الجدول الزمني التقديري: مرحلة التأسيس والتصميم (أسبوعان)، التطوير الأساسي (3 أسابيع)، الاختبار والتجربة (أسبوع)، الإطلاق والتدريب (4 أيام).
• ملاحظة تشغيلية: الفوترة الإلكترونية المصرية والسعودية مدروسة ضمن النطاق حسب بلد العميل.`;
}

// ------------------------------------------------------------
// محتوى تسويقي (بديل ذكي)
// ------------------------------------------------------------

function fallbackMarketing(topic: string, platform: string): string {
  const t = topic.trim() || "إطلاق خدمة جديدة";
  return `مقترح مروان — بوست ${platform}:
العنوان: لماذا يتأخر مشروعك الرقمي بينما منافسك يطلق في أسابيع؟

النص:
كثير من أصحاب الأعمال في مصر والسعودية يخسرون عملاء يومياً بسبب غياب منصة رقمية احترافية.
في نوفا كود نبني مواقع وتطبيقات وأنظمة إدارة تبدأ من ${formatPrice(12000, "EGP")} أو ${formatPrice(1800, "SAR")} — مع فريق ذكاء اصطناعي يجهز مقترحك قبل أول اجتماع.
لا يبدأ تنفيذ أي مشروع إلا بعد اعتماد الإدارة — لأن ثقتك أهم من البيع.
راسلنا الآن: واتساب ${COMPANY.whatsappDisplay} — ${COMPANY.email}
الموضوع: ${t}

هاشتاجات: #نوفا_كود #برمجة #تصميم_مواقع #تطبيقات #مصر #السعودية #NovaCode #DigitalTransformation

----------------------------------------------------------

سكريبت دانا — فيديو تيك توك (35 ثانية):

(0-3 ثوان) خطاف — مشهد شاشة سوداء ثم نص: "مشروعك البرمجي ممكن يتسلم في أسابيع.. مش سنين"
(3-10 ثوان) مشهد: شخص يتصفح موقعاً بطيئاً — تعليق صوتي: "لو موقعك بطيء أو شكله قديم، العميل بيروح لمنافسك في ثانيتين"
(10-22 ثوان) مشهد: لقطات واجهات نوفا كود — تعليق: "إحنا في نوفا كود بنصمم ونبرمج مواقع وتطبيقات وأنظمة إدارة بالعربي وبتجربة عالمية، وأسعارنا واضحة بالجنيه المصري والريال السعودي"
(22-30 ثوان) نص على الشاشة: "فريق ذكاء اصطناعي محلي + اعتماد إداري قبل التنفيذ" — تعليق: "وعندنا فريق ذكاء اصطناعي بيجهز مقترح مشروعك قبل ما تدفع مليم"
(30-35 ثوان) خاتمة — نص كبير: "واتساب ${COMPANY.whatsappDisplay}" — تعليق: "ابعتلنا دلوقتي على واتساب وهنرد عليك النهاردة"`;
}

// ------------------------------------------------------------
// واجهات التشغيل العامة
// ------------------------------------------------------------

export async function runCustomerServiceAgent(
  sessionMarket: "EG" | "SA",
  history: { role: "user" | "assistant"; content: string }[],
  userMessage: string,
  directives: string[] = [],
): Promise<{ reply: string; agent: AgentDef; via: "ollama" | "fallback" }> {
  const agent = pickCsAgent(sessionMarket);
  const directiveBlock = directives.length
    ? `\n\nأوامر عمل نشطة صادرة من المدير (لها أولوية قصوى، طبّقها حرفياً في ردك):\n${directives
        .map((d) => `- ${d}`)
        .join("\n")}`
    : "";
  const system = csSystem(agent.name, sessionMarket) + directiveBlock;
  const convo =
    history
      .slice(-8)
      .map((h) => `${h.role === "user" ? "العميل" : agent.name}: ${h.content}`)
      .join("\n") + `\nالعميل: ${userMessage}\n${agent.name}:`;
  const ai = await ollamaChat(system, convo);
  if (ai) return { reply: ai, agent, via: "ollama" };
  let reply = fallbackCsReply(userMessage, sessionMarket);
  if (directives.length) {
    reply = `تنويه مهم من إدارة نوفا كود:\n${directives
      .map((d) => `- ${d}`)
      .join("\n")}\n\n${reply}`;
  }
  return { reply, agent, via: "fallback" };
}

export async function runDevTeam(
  orderText: string,
  service: string,
): Promise<{ content: string; via: "ollama" | "fallback"; agents: string[] }> {
  const sections: string[] = [];
  let usedOllama = false;
  const orderSummary = `الخدمة المطلوبة: ${service}\nتفاصيل العميل:\n${orderText}`;
  for (const id of ["kareem", "sara", "omar"] as const) {
    const p = DEV_PROMPTS[id](orderSummary);
    const out = await ollamaChat(p.system, p.user);
    if (out) {
      usedOllama = true;
      const agent = AGENTS.find((a) => a.id === id)!;
      sections.push(`— ${agent.name} (${agent.role}) —\n${out}`);
    }
  }
  if (!usedOllama || sections.length < 3) {
    // الدمج: أي قسم غاب يُكمل من البديل الذكي
    const fallback = fallbackDevProposal(orderText, service);
    if (sections.length === 0) {
      return {
        content: fallback,
        via: "fallback",
        agents: ["كريم", "سارة", "عمر"],
      };
    }
    return {
      content: sections.join("\n\n") + `\n\n— أقسام مكملة من النظام البديل —\n${fallback}`,
      via: usedOllama ? "ollama" : "fallback",
      agents: ["كريم", "سارة", "عمر"],
    };
  }
  return { content: sections.join("\n\n"), via: "ollama", agents: ["كريم", "سارة", "عمر"] };
}

export async function runMarketingTeam(
  topic: string,
  platform: string,
): Promise<{ content: string; via: "ollama" | "fallback"; agents: string[] }> {
  const m = MARKETING_PROMPTS.marwan(topic, platform);
  const d = MARKETING_PROMPTS.dana(topic, platform);
  const [post, script] = await Promise.all([
    ollamaChat(m.system, m.user),
    ollamaChat(d.system, d.user),
  ]);
  if (post || script) {
    const parts: string[] = [];
    if (post) parts.push(`— مروان (صانع المحتوى) —\n${post}`);
    else parts.push(fallbackMarketing(topic, platform).split("----------------------------------------------------------")[0].trim());
    if (script) parts.push(`— دانا (السكريبتات والإعلانات) —\n${script}`);
    else parts.push(`— دانا (بديل ذكي) —\n` + fallbackMarketing(topic, platform).split("----------------------------------------------------------")[1].trim());
    return { content: parts.join("\n\n"), via: "ollama", agents: ["مروان", "دانا"] };
  }
  return { content: fallbackMarketing(topic, platform), via: "fallback", agents: ["مروان", "دانا"] };
}
