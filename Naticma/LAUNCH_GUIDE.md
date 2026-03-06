# 🚀 دليل إطلاق NaticMA — من الصفر للإنترنت
## الوقت المطلوب: حوالي ساعتين

---

# ══════════════════════════════════════════════
# الخطوة 1 — إنشاء حسابات (15 دقيقة)
# ══════════════════════════════════════════════

افتح هذه الروابط وأنشئ حسابات مجانية:

| الموقع | الرابط | لماذا تحتاجه |
|---|---|---|
| GitHub | https://github.com | لرفع الكود |
| Railway | https://railway.app | لتشغيل الـ Backend |
| Vercel | https://vercel.com | لنشر الموقع |
| MongoDB Atlas | https://cloud.mongodb.com | قاعدة البيانات |
| Lemon Squeezy | https://app.lemonsqueezy.com | استقبال المدفوعات |

**نصيحة:** استخدم GitHub للدخول في Railway وVercel (أسرع).

---

# ══════════════════════════════════════════════
# الخطوة 2 — إعداد MongoDB Atlas (10 دقائق)
# ══════════════════════════════════════════════

1. ادخل https://cloud.mongodb.com
2. اضغط **Build a Database** ← اختر **Free (M0)**
3. اختر أقرب منطقة (Europe - Paris مثلاً)
4. اضغط **Create**
5. أنشئ مستخدم: Username + Password (احفظهما)
6. في **Network Access** اضغط **Add IP** ← اكتب `0.0.0.0/0` ← **Confirm**
7. اذهب إلى **Database** ← اضغط **Connect** ← **Drivers**
8. انسخ الرابط الذي يبدأ بـ `mongodb+srv://...`
9. استبدل `<password>` بكلمة المرور الفعلية

```
مثال:
mongodb+srv://myuser:mypass123@cluster0.abc.mongodb.net/naticma
```
**احفظ هذا الرابط — هو MONGODB_URI**

---

# ══════════════════════════════════════════════
# الخطوة 3 — إعداد Lemon Squeezy (20 دقيقة)
# ══════════════════════════════════════════════

### 3.1 إنشاء المتجر
1. ادخل https://app.lemonsqueezy.com
2. اضغط **Create a store**
3. اسم المتجر: `NaticMA`
4. العملة: `USD`
5. **الـ Store ID** موجود في URL الصفحة:
   ```
   https://app.lemonsqueezy.com/stores/12345
                                              ↑ هذا LS_STORE_ID
   ```

### 3.2 إنشاء منتج
1. اذهب إلى **Products** ← **New Product**
2. الاسم: `Domain Registration`
3. النوع: **Single payment**
4. السعر: `1` (سيتغير ديناميكياً من الكود)
5. اضغط **Save**
6. افتح المنتج ← **Variants** ← انسخ رقم الـ Variant
   ```
   هذا هو LS_VARIANT_ID
   ```

### 3.3 إنشاء API Key
1. اذهب إلى **Settings** ← **API**
2. اضغط **Create API Key** ← الاسم: `NaticMA`
3. انسخ المفتاح فوراً ← **هذا LS_API_KEY** ⚠️ لن يظهر مرة ثانية

### 3.4 إعداد Webhook (بعد نشر Backend)
1. اذهب إلى **Settings** ← **Webhooks** ← **Add Webhook**
2. URL: `https://naticma-backend.up.railway.app/api/payments/webhook`
   *(ستحصل على هذا الرابط في الخطوة 7)*
3. فعّل: `order_created` و `order_refunded`
4. انسخ **Signing Secret** ← هذا `LS_WEBHOOK_SECRET`

### 3.5 إضافة طريقة استلام المال
1. اذهب إلى **Settings** ← **Payouts**
2. افتح حساباً على **Wise.com** (مجاني، يقبل المغرب)
3. أضف بيانات Wise في Lemon Squeezy
4. المال يصل كل أسبوعين تلقائياً 💰

---

# ══════════════════════════════════════════════
# الخطوة 4 — رفع الكود على GitHub (10 دقائق)
# ══════════════════════════════════════════════

### تثبيت Git
- Windows: https://git-scm.com/download/win ← نزّل وثبّت
- Mac: مثبّت مسبقاً
- Linux: `sudo apt install git`

### رفع المشروع

1. افتح **Terminal** (أو Command Prompt في Windows) داخل مجلد `naticma`

2. شغّل هذه الأوامر واحداً تلو الآخر:

```bash
git init
git add .
git commit -m "🚀 NaticMA - Initial commit"
```

3. اذهب إلى https://github.com ← **New Repository**
   - الاسم: `naticma`
   - Public أو Private (كما تريد)
   - اضغط **Create repository**

4. انسخ الأوامر التي يعطيك إياها GitHub وشغّلها:
```bash
git remote add origin https://github.com/USERNAME/naticma.git
git branch -M main
git push -u origin main
```

✅ الكود الآن على GitHub!

---

# ══════════════════════════════════════════════
# الخطوة 5 — نشر Backend على Railway (10 دقائق)
# ══════════════════════════════════════════════

1. ادخل https://railway.app
2. اضغط **Login with GitHub**
3. اضغط **New Project** ← **Deploy from GitHub Repo**
4. اختر `naticma`
5. Railway سيسألك: **Root Directory** ← اكتب `backend`
6. اضغط **Deploy Now**

### إضافة المتغيرات
1. في Railway ← مشروعك ← اضغط **Variables**
2. اضغط **Raw Editor** والصق هذا (بعد تعبئة البيانات):

```
PORT=5000
NODE_ENV=production
MONGODB_URI=← الرابط من الخطوة 2
JWT_SECRET=naticma_2024_super_secret_key_change_me
NAMECHEAP_API_USER=← اسم مستخدم Namecheap
NAMECHEAP_API_KEY=← مفتاح Namecheap
NAMECHEAP_CLIENT_IP=← سيظهر في Namecheap تلقائياً
NAMECHEAP_SANDBOX=false
LS_API_KEY=← من الخطوة 3.3
LS_STORE_ID=← من الخطوة 3.1
LS_VARIANT_ID=← من الخطوة 3.2
LS_WEBHOOK_SECRET=← من الخطوة 3.4
FRONTEND_URL=https://naticma.vercel.app
```

### الحصول على رابط Backend
1. في Railway ← **Settings** ← **Domains**
2. اضغط **Generate Domain**
3. ستحصل على رابط مثل:
   ```
   https://naticma-backend.up.railway.app
   ```
   **احفظه!**

---

# ══════════════════════════════════════════════
# الخطوة 6 — نشر Frontend على Vercel (10 دقائق)
# ══════════════════════════════════════════════

### تحديث رابط الـ Backend في الكود
1. افتح `frontend/index.html`
2. ابحث عن هذا السطر (قريب من نهاية الملف):
   ```javascript
   const API = 'https://naticma-backend.up.railway.app/api';
   ```
3. استبدل `naticma-backend.up.railway.app` برابط Railway الفعلي الخاص بك
4. احفظ الملف ثم ارفع التغيير:
   ```bash
   git add .
   git commit -m "Update API URL"
   git push
   ```

### النشر على Vercel
1. ادخل https://vercel.com
2. اضغط **Continue with GitHub**
3. اضغط **Add New** ← **Project**
4. اختر `naticma`
5. **Framework Preset**: Other
6. **Root Directory**: اكتب `frontend`
7. اضغط **Deploy** 🚀

بعد دقيقتين:
```
🎉 موقعك يعمل على: https://naticma.vercel.app
```

---

# ══════════════════════════════════════════════
# الخطوة 7 — الظهور في Google (5 دقائق)
# ══════════════════════════════════════════════

### تسجيل في Google Search Console
1. اذهب إلى https://search.google.com/search-console
2. اضغط **Add Property**
3. اكتب: `https://naticma.vercel.app`
4. اختر **HTML tag** للتحقق
5. انسخ الـ meta tag المعطى مثل:
   ```html
   <meta name="google-site-verification" content="abc123xyz">
   ```
6. افتح `frontend/index.html` وأضفه داخل `<head>` بعد السطر الأول
7. ارفع التغيير:
   ```bash
   git add . && git commit -m "Add Google verification" && git push
   ```
8. ارجع لـ Search Console واضغط **Verify** ✅

### إرسال Sitemap
1. في Search Console ← **Sitemaps**
2. اكتب: `sitemap.xml`
3. اضغط **Submit**

**Google سيبدأ فهرسة موقعك خلال 3-7 أيام** ⏳

### تسجيل في Bing أيضاً
1. اذهب إلى https://www.bing.com/webmasters
2. نفس الخطوات السابقة

---

# ══════════════════════════════════════════════
# الخطوة 8 — اختبار كل شيء ✅
# ══════════════════════════════════════════════

افتح https://naticma.vercel.app وتحقق من كل هذا:

- [ ] الموقع يفتح ويظهر بشكل صحيح
- [ ] البحث عن نطاق يعطي نتائج
- [ ] إنشاء حساب جديد يعمل
- [ ] تسجيل الدخول يعمل
- [ ] زر "انتقل للدفع" يفتح صفحة Lemon Squeezy
- [ ] الدفع بالبطاقة التجريبية `4242 4242 4242 4242` ينجح
- [ ] بعد الدفع يرجع للموقع مع رسالة ✅
- [ ] "طلباتي" تظهر الطلب المدفوع
- [ ] Google Search Console تقبل الموقع

---

# ══════════════════════════════════════════════
# ملخص التكاليف
# ══════════════════════════════════════════════

| الخدمة | التكلفة |
|---|---|
| GitHub | مجاني ✅ |
| Railway (Backend) | مجاني حتى 500 ساعة/شهر ✅ |
| Vercel (Frontend) | مجاني ✅ |
| MongoDB Atlas | مجاني ✅ |
| Lemon Squeezy | 5% عمولة فقط عند البيع ✅ |
| **النطاق naticma.vercel.app** | **مجاني تماماً ✅** |
| نطاق .com مخصص (مستقبلاً) | $12/سنة |

## 💰 التكلفة الآن = $0

---

# بطاقة الدفع التجريبية لـ Lemon Squeezy

```
رقم البطاقة : 4242 4242 4242 4242
التاريخ     : أي تاريخ مستقبلي (مثل 12/27)
CVV         : 123
الاسم       : أي اسم
```
