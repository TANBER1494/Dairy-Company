const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    target_role: {
      type: String,
      enum: ['Admin', 'InventoryAccountant', 'GeneralAccountant'],
      required: true,
    },
    target_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: [
        'PAYMENT_RECEIVED',
        'SUPPLIER_DELIVERY',
        'INVENTORY_ALERT',
        'SYSTEM_UPDATE',
        'GENERAL_ALERT'
      ],
      required: true,
    },
    link: {
      type: String,
      default: null,
    },
    is_read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Index for optimizing queries by role and creation date
notificationSchema.index({ target_role: 1, createdAt: -1 });

// TTL index to automatically delete notifications after 30 days
notificationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 30 * 24 * 60 * 60 }
);

module.exports = mongoose.model('Notification', notificationSchema);