# حرق اسعار — المتجر + لوحة الإدارة

متجر إلكتروني (React + Express) ولوحة إدارة، يتشاركان **نفس قاعدة بيانات Supabase**.

## المجلدات

| المجلد | الوظيفة | منفذ التطوير |
| --- | --- | --- |
| `s/` | موقع العملاء (الواجهة الأمامية للمتجر) | 3000 |
| `a/` | لوحة إدارة المتجر (الأدمن) | 3001 |

كل مجلد يحتوي على نسخة كاملة قابلة للتشغيل (الواجهة + السيرفر + ملفات قاعدة البيانات)؛
كلاهما يتصل بنفس قاعدة البيانات المشتركة.

## التشغيل محلياً

```bash
cd s && npm install && npm run dev
cd a && npm install && npm run dev
```

- المتجر: http://localhost:3000
- لوحة الإدارة: http://localhost:3001
- الدخول: `admin` / `admin123`

## قاعدة البيانات

مشروع Supabase الجديد: `alhamd-store-live` (ref `jzgsnfmxxpuuyldnlquu`).
المشروع القديم `alhamd-store-db` لم يتم تعديله.

انسخ `.env.example` إلى `.env.local` في كل مجلد وضبط:

```
SUPABASE_DB_URL=postgresql://postgres.<ref>:<password>@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true
SESSION_SECRET=<نفس القيمة في المجلدين>
ADMIN_EMAILS=admin@alhamd.local,amn2asayed@gmail.com,admin@alhamd.store
```

ثم `npm run db:setup` (مرة واحدة تكفي) — يطبّق `db/schema.sql` ويجهّز البيانات الابتدائية.

> لا ترفع `.env.local` إلى GitHub.

## النشر الحي (Railway)

- المتجر: https://alhamd-store-live-production.up.railway.app
- لوحة الإدارة: https://alhamd-admin-live-production.up.railway.app
- الدخول: `admin` / `admin123`

كل خدمة تشير إلى نفس قاعدة Supabase الجديدة. كلا العنوانين يستجيبان على
`/api/health` ويعملان دون إعداد إضافي.

راجع [DEPLOYMENT.md](DEPLOYMENT.md) لتفاصيل المتغيرات وملف `render.yaml`
الذي يجهّز خدمتين على Render كبديل.

الهوية البصرية مطابقة للأصل: الشعار، خط Tajawal، الأصفر `#FED700` والأزرق `#007185`،
واسم "حرق اسعار". الفوتر: برمجة و تصميم islam badawi.
