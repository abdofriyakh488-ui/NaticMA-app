const router  = require('express').Router();
const axios   = require('axios');
const crypto  = require('crypto');
const express = require('express');
const authMiddleware = require('../middleware/auth');
const Order   = require('../models/Order');

const RENT_MONTHS = { '1m': 1, '3m': 3, '6m': 6, '1y': 12 };

const PRICES = {
  '.com': { buy: 12.99, rent: 2.99 }, '.net': { buy: 13.99, rent: 2.99 },
  '.org': { buy: 11.99, rent: 2.49 }, '.io':  { buy: 39.99, rent: 5.99 },
  '.co':  { buy: 24.99, rent: 4.49 }, '.app': { buy: 19.99, rent: 3.99 },
  '.ai':  { buy: 79.99, rent: 9.99 }, '.ma':  { buy: 18.99, rent: 3.49 },
  '.dz':  { buy: 16.99, rent: 3.19 }, '.tn':  { buy: 15.99, rent: 2.99 },
};

// Lemon Squeezy API client
const lsApi = axios.create({
  baseURL: 'https://api.lemonsqueezy.com/v1',
  headers: {
    Authorization: `Bearer ${process.env.LS_API_KEY}`,
    Accept:        'application/vnd.api+json',
    'Content-Type':'application/vnd.api+json',
  },
});

// ─────────────────────────────────────────────────────────
// POST /api/payments/create-checkout
// يُنشئ رابط دفع على Lemon Squeezy ويُعيده للـ Frontend
// ─────────────────────────────────────────────────────────
router.post('/create-checkout', authMiddleware, async (req, res) => {
  try {
    const { domain, type, duration, tld } = req.body;
    if (!domain || !type) return res.status(400).json({ error: 'بيانات ناقصة.' });

    // حساب السعر
    const domainTld  = tld || '.' + domain.split('.').slice(1).join('.');
    const price      = PRICES[domainTld] || { buy: 14.99, rent: 3.49 };
    let   amountUSD;
    if (type === 'buy') {
      amountUSD = price.buy;
    } else {
      const months = RENT_MONTHS[duration || '1m'] || 1;
      amountUSD = parseFloat((price.rent * months).toFixed(2));
    }

    // حساب تاريخ الانتهاء
    const expiresAt = new Date();
    if (type === 'buy') {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + (RENT_MONTHS[duration || '1m'] || 1));
    }

    // إنشاء الطلب في قاعدة البيانات بحالة "معلق"
    const order = await Order.create({
      user:      req.user._id,
      domain,
      type,
      duration:  duration || (type === 'buy' ? '1y' : '1m'),
      amount:    Math.round(amountUSD * 100),
      status:    'pending',
      expiresAt,
    });

    // إنشاء Checkout على Lemon Squeezy
    const lsRes = await lsApi.post('/checkouts', {
      data: {
        type: 'checkouts',
        attributes: {
          custom_price: Math.round(amountUSD * 100), // السعر بالسنت
          checkout_data: {
            email: req.user.email,
            name:  req.user.name,
            custom: {
              orderId:  order._id.toString(),
              userId:   req.user._id.toString(),
              domain,
              type,
              duration: duration || '1y',
            },
          },
          product_options: {
            name:               `${type === 'buy' ? 'شراء' : 'كراء'} نطاق: ${domain}`,
            description:        `NaticMA — تسجيل ${domain}`,
            redirect_url:       `${process.env.FRONTEND_URL}?success=1&order=${order._id}`,
            receipt_button_text:'العودة للموقع',
            receipt_link_url:   process.env.FRONTEND_URL,
          },
        },
        relationships: {
          store:   { data: { type: 'stores',   id: process.env.LS_STORE_ID   } },
          variant: { data: { type: 'variants', id: process.env.LS_VARIANT_ID } },
        },
      },
    });

    const checkoutUrl = lsRes.data.data.attributes.url;
    res.json({ checkoutUrl, orderId: order._id, amount: amountUSD });

  } catch (err) {
    console.error('❌ Checkout error:', err.response?.data || err.message);
    res.status(500).json({ error: 'خطأ في إنشاء الدفع، حاول مجدداً.' });
  }
});

// ─────────────────────────────────────────────────────────
// POST /api/payments/webhook
// Lemon Squeezy يُرسل هنا إشعارات بعد كل عملية دفع
// ─────────────────────────────────────────────────────────
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  // التحقق من التوقيع الأمني
  const secret = process.env.LS_WEBHOOK_SECRET;
  const hmac   = crypto.createHmac('sha256', secret);
  const digest = Buffer.from(hmac.update(req.body).digest('hex'), 'utf8');
  const sig    = Buffer.from(req.headers['x-signature'] || '', 'utf8');

  if (digest.length !== sig.length || !crypto.timingSafeEqual(digest, sig)) {
    console.error('❌ توقيع Webhook غير صالح');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const event     = JSON.parse(req.body);
  const eventName = event.meta?.event_name;
  const custom    = event.meta?.custom_data || {};
  console.log(`📩 Webhook: ${eventName}`);

  // دفع ناجح
  if (eventName === 'order_created') {
    if (custom.orderId) {
      await Order.findByIdAndUpdate(custom.orderId, { status: 'active' });
      console.log(`✅ نطاق مفعّل: ${custom.domain}`);
    }
  }

  // استرجاع / إلغاء
  if (eventName === 'order_refunded') {
    if (custom.orderId) {
      await Order.findByIdAndUpdate(custom.orderId, { status: 'failed' });
      console.log(`🔄 طلب مُسترجع: ${custom.domain}`);
    }
  }

  res.json({ received: true });
});

// GET /api/payments/verify?order=ID — التحقق من الطلب بعد الـ redirect
router.get('/verify', authMiddleware, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.query.order, user: req.user._id });
    if (!order) return res.status(404).json({ error: 'الطلب غير موجود.' });
    res.json({ order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
