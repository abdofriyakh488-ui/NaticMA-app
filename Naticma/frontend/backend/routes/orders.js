const router = require('express').Router();
const authMiddleware = require('../middleware/auth');
const Order = require('../models/Order');

// GET /api/orders — user's orders
router.get('/', authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في جلب الطلبات.' });
  }
});

// GET /api/orders/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) return res.status(404).json({ error: 'الطلب غير موجود.' });
    res.json({ order });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في جلب الطلب.' });
  }
});

module.exports = router;
