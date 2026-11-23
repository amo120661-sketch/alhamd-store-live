# نشر المتجر ولوحة الإدارة

GitHub Pages **لا يشغّل** Express/API، لذلك استخدمنا استضافة كاملة (Railway، مع Render كبديل).

## النشر الحي الحالي (Railway)

| الخدمة | الرابط | المشروع/البيئة |
| --- | --- | --- |
| المتجر | https://alhamd-store-live-production.up.railway.app | `successful-essence` / `production` |
| الأدمن | https://alhamd-admin-live-production.up.railway.app | `successful-essence` / `production` |

كلا الخدمتين تستخدمان `Root Directory` مختلفاً (`s` و`a` على التوالي)، وتشتركان في نفس
`SUPABASE_DB_URL` و`SESSION_SECRET`. المنفذ الذي تستمع له التطبيقات هو `8080`
(يضبطه Railway تلقائياً عبر `PORT`)، وهو `targetPort` للنطاق العام.


## 1) قاعدة البيانات (تمت)

- مشروع Supabase الجديد: `alhamd-store-live` — `jzgsnfmxxpuuyldnlquu`
- المشروع القديم `alhamd-store-db` **لم يُلمس**.
- رابط الاتصال (Transaction pooler, port 6543):

```
postgresql://postgres.jzgsnfmxxpuuyldnlquu:<DB_PASSWORD>@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

## 2) Render

1. افتح https://dashboard.render.com/ واربط حساب GitHub `(amo120661-sketch)`.
2. **New → Blueprint** واختر هذا المستودع. سيقرأ `render.yaml` وينشئ خدمتين:
   - `alhamd-storefront` (من `s/`)
   - `alhamd-admin` (من `a/`)
3. عندما يطلب Blueprint قيم المتغيرات، أدخل:
   - `SUPABASE_DB_URL` — الرابط أعلاه بعد استبدال `<DB_PASSWORD>` بكلمة مرور المشروع الجديد.
   - `SESSION_SECRET` — نفس القيمة الطويلة العشوائية في الخدمتين (مثال: `openssl rand -hex 32`).
   - `APP_URL` — رابط الخدمة بعد النشر (مثلاً `https://alhamd-storefront.onrender.com`).
4. بعد أول نشر، افتح `https://alhamd-storefront.onrender.com/api/health` — يجب أن ترى
   `{"ok":true,"db":"connected"}`.
5. افتح رابط الأدمن وسجّل الدخول بـ `admin` / `admin123`.

## 3) Railway (مُطبّق حالياً)

أنشئ مشروعاً لكل مجلد (`s` و `a`)، اضبط متغيرات البيئة نفسها،
ثم `Build: npm ci && npm run build` و `Start: npm start`.

تم بالفعل إنشاء الخدمتين `alhamd-store-live` (من `s/`) و`alhamd-admin-live` (من `a/`)
فوق نفس المشروع `successful-essence` بنفس قاعدة البيانات. لإعادة النشر بعد تعديل كود:

```bash
git push origin main
# ثم من Railway: Deployments → Deploy (أو CLI: railway up)
```

> ملاحظة: أثناء النشر الأول ظهر تعارض `esbuild` مع `vite@8` أثناء `npm ci`؛
> تم حله بتثبيت `esbuild@^0.28.0` في كلا التطبيقين وتحديث ملفي `package-lock.json`.

## ملاحظات

- `SESSION_SECRET` يجب أن يكون **نفس القيمة** في الخدمتين حتى تتطابق الجلسات.
- لا تضع كلمة مرور قاعدة البيانات داخل المستودع. استخدم Environment Variables في لوحة النشر.
- عند تغيير كلمة مرور Supabase، حدّث `SUPABASE_DB_URL` في الخدمتين.
