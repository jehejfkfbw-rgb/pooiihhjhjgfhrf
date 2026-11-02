# 🚀 دليل نشر نوفا ديجيتال على Vercel — بدون أخطاء

## سبب الخطأ
"No Next.js version detected" = Vercel ما لقاش `package.json` في **الدلة الصح**.

## الحل — اتبع الخطوات بالترتيب

### الخطوة 1: تأكد إن بنية الريبو صح (الأهم!)
لازم `package.json` يكون **في نفس الدلة الرئيسية للريبو** (مش جوّا فولدر):

```
✅ الصح:                      ❌ الغلط:
nova-digital/                nova-digital/
├── package.json             └── nova-digital/     ← فولدر زيادة!
├── next.config.ts                   └── package.json
├── tsconfig.json                    └── src/
├── src/
├── public/
└── vercel.json
```

لو رافع **ZIP**: افتحه وشوف — لازم الملفات مش جوّا فولدر متكرر.
لو رافع **GitHub**: دوس على الريبو على موقع جيت هاب ولو شايف `package.json` جوّا فولدر، ده الغلط.

### الخطوة 2: إعداد Root Directory على Vercel
1. افتح **vercel.com** → مشروعك
2. **Settings → General**
3. دور على **Root Directory**:
   - لو `package.json` في جذر الريبو → **سيبه فاضي** (أو اكتب `.`)
   - لو ملفاتك جوّا فولدر واحد → **اكتب اسم الفولدر** (مثلاً `nova-digital`)
4. دوس **Save**

### الخطوة 3: أعد النشر
1. من **Deployments** → آخر عملية → النقاط `...` → **Redeploy**
2. استنّى دقيقتين

### الخطوة 4: متغيرات البيئة (لو مش موجودة)
**Settings → Environment Variables** → ضيف:
```
DATABASE_URL = postgresql://... (الرابط بتاع Neon على Vercel)
```
وأول زيارة بعد النشر هتبني كل الجداول تلقائيًا (Self-Heal).

## ملاحظات
- `vercel.json` موجود في المشروع ويحدد `framework: nextjs` يدويًا عشان مفيش لبس في الكشف.
- الإصدارات المثبتة: `next 16.2.6`, `react 19.2.6`, `react-dom 19.2.6`.
- لو الخطوا اختلف شوية حسب واجهة Vercel الجديدة، المبدأ واحد: **لقي package.json = النشر نجح**.
