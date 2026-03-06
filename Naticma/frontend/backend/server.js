require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const domainRoutes = require('./routes/domains');
const paymentRoutes = require('./routes/payments');
const orderRoutes = require('./routes/orders');

const app = express();

// ── Middleware ─────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Raw body needed for Stripe webhooks BEFORE json parser
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/', limiter);

// ── Database ───────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// ── Routes ─────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/domains',  domainRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/orders',   orderRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', version: '1.0.0' }));

// ── Error handler ──────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 NaticMA backend running on port ${PORT}`));
