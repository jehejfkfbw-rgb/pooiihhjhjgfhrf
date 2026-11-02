// ============================================================
// NOVA FORGE — مولّد الكود المحلي
// بيبني ملفات مشروع حقيقية حسب نوع الخدمة وبيانات العميل.
// صفر API خارجي — التوليد كله على السيرفر المحلي.
// ============================================================

export type ForgeFile = { path: string; lang: string; lines: string[] };

export type ForgeBuild = {
  orderCode: string;
  title: string;
  client: string;
  stack: string;
  intro: string[];
  files: ForgeFile[];
};

export type ForgeInput = {
  code: string;
  client: string;
  serviceName: string;
  category: string;
  features: string[];
};

const ACCENTS = ["#7c3aed", "#0891b2", "#db2777", "#059669", "#d97706", "#dc2626"];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function webFiles(client: string, features: string[], accent: string): ForgeFile[] {
  const cards = features.length ? features : ["خدمة مميزة", "جودة عالية", "دعم مستمر"];
  return [
    {
      path: "index.html",
      lang: "html",
      lines: [
        "<!doctype html>",
        "<html lang=\"ar\" dir=\"rtl\">",
        "<head>",
        "  <meta charset=\"utf-8\">",
        "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">",
        "  <title>" + client + " | الموقع الرسمي</title>",
        "  <link rel=\"stylesheet\" href=\"assets/style.css\">",
        "</head>",
        "<body>",
        "  <header class=\"topnav\">",
        "    <span class=\"brand\">✦ " + client + "</span>",
        "    <nav>",
        "      <a href=\"#services\">خدماتنا</a>",
        "      <a href=\"#about\">من نحن</a>",
        "      <a href=\"#contact\">تواصل معنا</a>",
        "    </nav>",
        "  </header>",
        "",
        "  <section class=\"hero\">",
        "    <h1>مرحبًا بك في <em>" + client + "</em></h1>",
        "    <p>حلول احترافية صُنعت بعناية لتناسب احتياجك — جودة تليق بك.</p>",
        "    <a class=\"cta\" href=\"#contact\">ابدأ الآن</a>",
        "  </section>",
        "",
        "  <section id=\"services\" class=\"grid\" aria-label=\"الخدمات\">",
        ...cards.map((f) => "    <article class=\"card\"><h3>" + f + "</h3><p>تفاصيل الخدمة وتخصيصها حسب طلب العميل.</p></article>"),
        "  </section>",
        "",
        "  <section id=\"contact\" class=\"contact\">",
        "    <h2>تواصل معنا</h2>",
        "    <form id=\"leadForm\">",
        "      <input name=\"name\" placeholder=\"اسمك\" required>",
        "      <input name=\"phone\" placeholder=\"رقم الموبايل\" required>",
        "      <button type=\"submit\">إرسال الطلب</button>",
        "    </form>",
        "  </section>",
        "",
        "  <footer class=\"footer\">",
        "    <p>© " + client + " — بناء وتسليم: NOVA CORE</p>",
        "  </footer>",
        "  <script src=\"assets/app.js\"></script>",
        "</body>",
        "</html>",
      ],
    },
    {
      path: "assets/style.css",
      lang: "css",
      lines: [
        ":root { --accent: " + accent + "; --bg: #05060f; --card: #0d1020; --text: #e5e7eb; }",
        "* { box-sizing: border-box; margin: 0; }",
        "body { background: var(--bg); color: var(--text); font-family: Cairo, system-ui, sans-serif; }",
        ".topnav { display: flex; justify-content: space-between; align-items: center; padding: 18px 6vw; position: sticky; top: 0; backdrop-filter: blur(12px); background: rgba(5,6,15,.8); border-bottom: 1px solid rgba(255,255,255,.07); }",
        ".brand { font-weight: 900; font-size: 20px; color: var(--accent); }",
        ".topnav nav a { color: var(--text); text-decoration: none; margin-inline: 12px; font-weight: 700; font-size: 14px; }",
        ".hero { text-align: center; padding: 110px 6vw 90px; background: radial-gradient(60% 80% at 50% 0%, " + accent + "22, transparent); }",
        ".hero h1 { font-size: clamp(28px, 6vw, 56px); font-weight: 900; }",
        ".hero em { color: var(--accent); font-style: normal; }",
        ".hero p { color: #94a3b8; margin: 18px auto 30px; max-width: 560px; line-height: 1.9; }",
        ".cta { background: var(--accent); color: #fff; padding: 14px 38px; border-radius: 999px; text-decoration: none; font-weight: 900; }",
        ".grid { display: grid; gap: 18px; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); padding: 40px 6vw 70px; }",
        ".card { background: var(--card); border: 1px solid rgba(255,255,255,.07); border-radius: 20px; padding: 26px; transition: .3s; }",
        ".card:hover { transform: translateY(-5px); border-color: " + accent + "88; }",
        ".card h3 { color: var(--accent); margin-bottom: 8px; }",
        ".card p { color: #94a3b8; font-size: 14px; line-height: 1.8; }",
        ".contact { text-align: center; padding: 60px 6vw; }",
        "#leadForm { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-top: 20px; }",
        "#leadForm input { background: var(--card); border: 1px solid rgba(255,255,255,.1); color: var(--text); padding: 13px 18px; border-radius: 12px; min-width: 220px; }",
        "#leadForm button { background: var(--accent); color: #fff; border: 0; padding: 13px 28px; border-radius: 12px; font-weight: 900; cursor: pointer; }",
        ".footer { text-align: center; padding: 26px; color: #64748b; border-top: 1px solid rgba(255,255,255,.07); font-size: 13px; }",
      ],
    },
    {
      path: "assets/app.js",
      lang: "js",
      lines: [
        "// NOVA CORE — تفاعلات الواجهة",
        "document.querySelectorAll('a[href^=\"#\"]').forEach(function (a) {",
        "  a.addEventListener('click', function (e) {",
        "    e.preventDefault();",
        "    var t = document.querySelector(a.getAttribute('href'));",
        "    if (t) t.scrollIntoView({ behavior: 'smooth' });",
        "  });",
        "});",
        "",
        "document.getElementById('leadForm').addEventListener('submit', function (e) {",
        "  e.preventDefault();",
        "  var d = new FormData(e.target);",
        "  alert('شكرًا يا ' + d.get('name') + '! استلمنا طلبك وهنكلمك في أقرب وقت.');",
        "  e.target.reset();",
        "});",
      ],
    },
    {
      path: "README.md",
      lang: "md",
      lines: [
        "# " + client + " — دليل التسليم",
        "",
        "بُني هذا المشروع بواسطة نواة نوفا (NOVA FORGE).",
        "",
        "## التشغيل",
        "- ارفع الملفات على أي استضافة، أو افتح index.html مباشرة.",
        "",
        "## التعديل",
        "- الألوان من متغير --accent في assets/style.css",
        "- المحتوى من index.html",
        "",
        "الدعم الفني: 3 شهور مجانًا ضمن الباقة.",
      ],
    },
  ];
}

function storeFiles(client: string, features: string[], accent: string): ForgeFile[] {
  return [
    {
      path: "index.html",
      lang: "html",
      lines: [
        "<!doctype html>",
        "<html lang=\"ar\" dir=\"rtl\">",
        "<head>",
        "  <meta charset=\"utf-8\">",
        "  <title>" + client + " | المتجر</title>",
        "  <link rel=\"stylesheet\" href=\"assets/store.css\">",
        "</head>",
        "<body>",
        "  <header class=\"bar\">",
        "    <span class=\"brand\">🛍️ " + client + "</span>",
        "    <button id=\"cartBtn\">السلة (<b id=\"cartCount\">0</b>)</button>",
        "  </header>",
        "",
        "  <main id=\"grid\" class=\"grid\"></main>",
        "",
        "  <aside id=\"cart\" class=\"cart\" hidden>",
        "    <h2>سلة المشتريات</h2>",
        "    <ul id=\"cartItems\"></ul>",
        "    <p class=\"total\">الإجمالي: <b id=\"cartTotal\">0</b> ج.م</p>",
        "    <p class=\"hint\">الدفع: فودافون كاش / انستاباي / كاش عند الاستلام</p>",
        "    <button id=\"checkoutBtn\">تأكيد الطلب</button>",
        "  </aside>",
        "",
        "  <script src=\"assets/store.js\"></script>",
        "</body>",
        "</html>",
      ],
    },
    {
      path: "assets/store.js",
      lang: "js",
      lines: [
        "// NOVA FORGE — منطق المتجر: " + client,
        "var PRODUCTS = [",
        "  { id: 1, name: 'منتج مميز 1', price: 250 },",
        "  { id: 2, name: 'منتج مميز 2', price: 480 },",
        "  { id: 3, name: 'منتج مميز 3', price: 175 },",
        "];",
        "var cart = [];",
        "",
        "function render() {",
        "  var g = document.getElementById('grid');",
        "  g.innerHTML = '';",
        "  PRODUCTS.forEach(function (p) {",
        "    g.innerHTML += '<div class=\"item\"><h3>' + p.name + '</h3>'",
        "      + '<p>' + p.price + ' ج.م</p>'",
        "      + '<button onclick=\"add(' + p.id + ')\">أضف للسلة</button></div>';",
        "  });",
        "}",
        "",
        "function add(id) {",
        "  cart.push(PRODUCTS.find(function (p) { return p.id === id; }));",
        "  document.getElementById('cartCount').textContent = cart.length;",
        "  document.getElementById('cartTotal').textContent =",
        "    cart.reduce(function (s, p) { return s + p.price; }, 0);",
        "}",
        "",
        "document.getElementById('cartBtn').onclick = function () {",
        "  document.getElementById('cart').hidden = false;",
        "};",
        "document.getElementById('checkoutBtn').onclick = function () {",
        "  alert('اتسجل طلبك! هنتواصل معاك لتأكيد الدفع والتوصيل.');",
        "};",
        "render();",
      ],
    },
    {
      path: "assets/store.css",
      lang: "css",
      lines: [
        ":root { --accent: " + accent + "; }",
        "body { margin: 0; background: #07080f; color: #e5e7eb; font-family: Cairo, sans-serif; }",
        ".bar { display: flex; justify-content: space-between; padding: 16px 6vw; position: sticky; top: 0; background: rgba(7,8,15,.9); backdrop-filter: blur(10px); }",
        ".brand { font-weight: 900; font-size: 19px; }",
        "#cartBtn { background: var(--accent); color: #fff; border: 0; border-radius: 10px; padding: 10px 18px; font-weight: 900; cursor: pointer; }",
        ".grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); padding: 30px 6vw; }",
        ".item { background: #0e1120; border: 1px solid rgba(255,255,255,.08); border-radius: 16px; padding: 22px; }",
        ".item button { background: var(--accent); color: #fff; border: 0; padding: 10px 16px; border-radius: 10px; margin-top: 12px; cursor: pointer; font-weight: 800; }",
        ".cart { position: fixed; inset-inline-end: 0; top: 0; bottom: 0; width: 320px; background: #0e1120; padding: 24px; border-inline-start: 1px solid rgba(255,255,255,.1); }",
        "#checkoutBtn { width: 100%; background: var(--accent); color: #fff; border: 0; padding: 14px; border-radius: 12px; font-weight: 900; cursor: pointer; }",
        ".hint { color: #64748b; font-size: 13px; }",
      ],
    },
    {
      path: "PAYMENTS.md",
      lang: "md",
      lines: [
        "# ربط الدفع — " + client,
        "",
        "1. فودافون كاش: تحويل على رقم المحفظة المسجل بالعقد",
        "2. انستاباي: على الحساب البنكي المتفق عليه",
        "3. PayMob: يضاف API KEY عند تفعيل الحساب التجاري",
        "",
        ...features.map((f) => "- ملاحظة تنفيذ: " + f),
        "",
        "تم التوليد بواسطة NOVA FORGE",
      ],
    },
  ];
}

function appFiles(client: string, features: string[], accent: string): ForgeFile[] {
  return [
    {
      path: "src/App.tsx",
      lang: "tsx",
      lines: [
        "// NOVA FORGE — تطبيق " + client,
        "import React, { useEffect, useState } from 'react';",
        "import { View, Text, TouchableOpacity, FlatList, StyleSheet, StatusBar } from 'react-native';",
        "",
        "export default function App() {",
        "  const [items, setItems] = useState<string[]>([]);",
        "",
        "  useEffect(() => {",
        "    setItems([" + features.map((f) => "'" + f + "'").join(", ") + "]);",
        "  }, []);",
        "",
        "  return (",
        "    <View style={s.root}>",
        "      <StatusBar barStyle=\"light-content\" />",
        "      <Text style={s.brand}>" + client + "</Text>",
        "      <Text style={s.sub}>تطبيقك الرسمي — صُنع بحب في نوفا</Text>",
        "      <FlatList",
        "        data={items}",
        "        keyExtractor={(i) => i}",
        "        renderItem={({ item }) => <View style={s.card}><Text style={s.cardTxt}>{item}</Text></View>}",
        "      />",
        "      <TouchableOpacity style={s.cta} onPress={() => {}}>",
        "        <Text style={s.ctaTxt}>اطلب الآن</Text>",
        "      </TouchableOpacity>",
        "    </View>",
        "  );",
        "}",
        "",
        "const s = StyleSheet.create({",
        "  root: { flex: 1, backgroundColor: '#07080f', padding: 24, paddingTop: 60 },",
        "  brand: { color: '#fff', fontSize: 30, fontWeight: '900', textAlign: 'center' },",
        "  sub: { color: '#94a3b8', textAlign: 'center', marginVertical: 14 },",
        "  card: { backgroundColor: '#0e1120', borderRadius: 16, padding: 18, marginBottom: 12 },",
        "  cardTxt: { color: '" + accent + "', fontWeight: '800' },",
        "  cta: { backgroundColor: '" + accent + "', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8 },",
        "  ctaTxt: { color: '#fff', fontWeight: '900' },",
        "});",
      ],
    },
    {
      path: "src/api.ts",
      lang: "ts",
      lines: [
        "// طبقة الربط مع الخادم",
        "const BASE = 'https://api." + client.replace(/\s+/g, "").slice(0, 12).toLowerCase() + ".app';",
        "",
        "export async function sendOrder(payload: { name: string; phone: string; notes: string }) {",
        "  const res = await fetch(BASE + '/orders', {",
        "    method: 'POST',",
        "    headers: { 'Content-Type': 'application/json' },",
        "    body: JSON.stringify(payload),",
        "  });",
        "  if (!res.ok) throw new Error('order failed');",
        "  return res.json();",
        "}",
      ],
    },
    {
      path: "README.md",
      lang: "md",
      lines: [
        "# تطبيق " + client,
        "",
        "```bash",
        "npm install",
        "npx expo start",
        "```",
        "",
        "النشر على المتجرين يتم عبر EAS Build — التوثيق الكامل مرفق في العقد.",
      ],
    },
  ];
}

function aiFiles(client: string, features: string[], accent: string): ForgeFile[] {
  return [
    {
      path: "bot/engine.js",
      lang: "js",
      lines: [
        "// NOVA FORGE — محرك البوت المحلي لصالح " + client,
        "const knowledge = require('./knowledge.json');",
        "",
        "function normalize(s) {",
        "  return s.toLowerCase()",
        "    .replace(/[\\u064B-\\u0652]/g, '')",
        "    .replace(/[\\u0623\\u0625\\u0622]/g, '\\u0627')",
        "    .replace(/\\u0629/g, '\\u0647')",
        "    .trim();",
        "}",
        "",
        "function reply(input) {",
        "  const q = normalize(input);",
        "  let best = null, score = 0;",
        "  for (const row of knowledge) {",
        "    let sc = 0;",
        "    for (const p of row.patterns) if (q.includes(normalize(p))) sc += 5 + p.length;",
        "    if (sc > score) { score = sc; best = row; }",
        "  }",
        "  return best ? best.answer : 'سؤالك وصلنا! فريق " + client + " هيرد عليك قريب.';",
        "}",
        "",
        "module.exports = { reply };",
      ],
    },
    {
      path: "bot/knowledge.json",
      lang: "json",
      lines: [
        "[",
        ...features.map((f, i) =>
          "  { \"patterns\": [\"" + f + "\"], \"answer\": \"رد مخصص عن: " + f + " — يعدّل من لوحة التحكم.\" }" + (i < features.length - 1 ? "," : ""),
        ),
        "  ,{ \"patterns\": [\"السلام عليكم\"], \"answer\": \"وعليكم السلام! أهلًا بيك في " + client + "\" }",
        "]",
      ],
    },
    {
      path: "README.md",
      lang: "md",
      lines: [
        "# بوت " + client,
        "",
        "حرر الردود من knowledge.json ثم أعد التشغيل:",
        "",
        "```bash",
        "node bot/engine.js",
        "```",
        "",
        "ألوان الهوية: " + accent,
      ],
    },
  ];
}

function systemFiles(client: string, features: string[], accent: string): ForgeFile[] {
  return [
    {
      path: "dashboard.html",
      lang: "html",
      lines: [
        "<!doctype html>",
        "<html lang=\"ar\" dir=\"rtl\">",
        "<head><meta charset=\"utf-8\"><title>لوحة " + client + "</title>",
        "<link rel=\"stylesheet\" href=\"admin/panel.css\"></head>",
        "<body>",
        "  <aside class=\"side\">",
        "    <h1 class=\"logo\">" + client + "</h1>",
        ...features.map((f) => "    <a class=\"item\">" + f + "</a>"),
        "  </aside>",
        "  <main class=\"main\">",
        "    <h2>نظرة عامة</h2>",
        "    <div class=\"stats\" id=\"stats\"></div>",
        "    <table class=\"table\" id=\"rows\"></table>",
        "  </main>",
        "  <script src=\"admin/api.js\"></script>",
        "</body>",
        "</html>",
      ],
    },
    {
      path: "admin/api.js",
      lang: "js",
      lines: [
        "// NOVA FORGE — بيانات اللوحة الحية",
        "const stats = [ { k: 'إجمالي السجلات', v: 0 }, { k: 'اليوم', v: 0 } ];",
        "",
        "function paint() {",
        "  document.getElementById('stats').innerHTML =",
        "    stats.map(function (s) { return '<div class=\"stat\"><b>' + s.v + '</b><span>' + s.k + '</span></div>'; }).join('');",
        "}",
        "paint();",
        "// الربط الفعلي بقاعدة البيانات بيتم عند التنصيب على سيرفر العميل",
      ],
    },
  ];
}

function docFiles(client: string, features: string[], kind: string): ForgeFile[] {
  return [
    {
      path: kind + "/plan.md",
      lang: "md",
      lines: [
        "# خطة " + client,
        "",
        "## المراحل",
        ...features.map((f, i) => (i + 1) + ". " + f),
        "",
        "## المتابعة",
        "- تقرير أسبوعي كل خميس",
        "- قناة تواصل مباشرة مع فريق نوفا",
        "",
        "صك بواسطة NOVA FORGE",
      ],
    },
  ];
}

export function buildProject(inp: ForgeInput): ForgeBuild {
  const accent = ACCENTS[hash(inp.code) % ACCENTS.length];
  const features = inp.features.length ? inp.features : ["خدمة مخصصة", "تنفيذ احترافي", "دعم بعد التسليم"];

  let files: ForgeFile[];
  let stack: string;
  switch (inp.category) {
    case "store": files = storeFiles(inp.client, features, accent); stack = "HTML + CSS + JS متجر"; break;
    case "app": files = appFiles(inp.client, features, accent); stack = "React Native + Expo"; break;
    case "ai": files = aiFiles(inp.client, features, accent); stack = "Node.js + قاعدة معرفة محلية"; break;
    case "system": files = systemFiles(inp.client, features, accent); stack = "لوحة إدارة Web"; break;
    case "design": files = docFiles(inp.client, features, "brand"); stack = "دليل هوية بصرية"; break;
    case "marketing": files = docFiles(inp.client, features, "campaign"); stack = "خطة حملة ممولة"; break;
    default: files = webFiles(inp.client, features, accent); stack = "HTML + CSS + JS موقع";
  }

  return {
    orderCode: inp.code,
    title: inp.serviceName,
    client: inp.client,
    stack,
    intro: [
      "▸ نواة نوفا: استلام مهمة " + inp.code + " — " + inp.serviceName,
      "▸ تحليل ملف العميل: " + inp.client,
      "▸ اختيار بنية المشروع: " + stack,
      "▸ توليد " + files.length + " ملفات... بدء الكتابة",
    ],
    files,
  };
}
