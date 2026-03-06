const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  domain:      { type: String, required: true },        // e.g. "mysite.com"
  type:        { type: String, enum: ['buy', 'rent'], required: true },
  duration:    { type: String, default: '1y' },         // 1m, 3m, 6m, 1y
  amount:      { type: Number, required: true },         // USD cents
  status:      {
    type: String,
    enum: ['pending', 'paid', 'active', 'expired', 'failed'],
    default: 'pending',
  },
  stripePaymentIntentId: { type: String, default: '' },
  namecheapOrderId:      { type: String, default: '' },
  expiresAt:   { type: Date },
  createdAt:   { type: Date, default: Date.now },
});

module.exports = mongoose.model('Order', orderSchema);
