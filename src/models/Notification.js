const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    farm_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Farm',
      required: true,
      index: true,
    },
    target_role: {
      type: String,
      enum: ['SUPER_ADMIN', 'SUPERVISOR'], 
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
        'CYCLE_STARTED',
        'CYCLE_ENDED',
        'HIGH_MORTALITY',
        'FEED_DELIVERY',
        'DAILY_LOG',
        'EGG_SALE',
        'SYSTEM',
        'SYNC_WARNING',
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

notificationSchema.index({ farm_id: 1, target_role: 1, createdAt: -1 });

notificationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 30 * 24 * 60 * 60 }
);

module.exports = mongoose.model('Notification', notificationSchema);