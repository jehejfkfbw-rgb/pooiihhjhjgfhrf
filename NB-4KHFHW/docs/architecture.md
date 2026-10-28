# البنية التقنية — متجر أزياء اختبار
Project NB-4KHFHW

## الاختيارات
- Frontend: HTML5 + CSS3 + Vanilla JS (بدون تبعيات) — RTL.
- Backend: Node.js http مدمج (بدون frameworks) — أسهل نشر وأقل مساحة هجمة.
- Database: PostgreSQL (مخطط مقترح في docs/db-schema.sql) — يُفعَّل عند توفر الاتصال.

## مخطط الطلب
browser → / (static من public/) → fetch /api/* → node http → JSON

## قرارات أمان
- تحقق من المسارات (no path traversal).
- حد 500 حرف على المدخلات الحرة.
- لا أسرار في الكود — متغيرات بيئة فقط.

