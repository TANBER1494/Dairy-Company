const mongoose = require('mongoose');

const cycleSchema = new mongoose.Schema(
  {
    local_id: { type: String, required: true, unique: true, index: true },
    farm_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Farm',
      required: true,
      index: true,
    },
    barn_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Barn',
      required: true,
    },
    supervisor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'اسم الدورة مطلوب'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['BROILER', 'LAYER'],
      required: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'CLOSED'], 
      default: 'ACTIVE',
    },
    start_date: {
      type: Date,
      required: [true, 'تاريخ استلام الكتاكيت/الطيور مطلوب'],
    },
    end_date: {
      type: Date,
      default: null,
    },
    initial_bird_count: {
      type: Number,
      required: [true, 'العدد الابتدائي للطيور مطلوب'],
      min: 1,
    },
    current_bird_count: {
      type: Number,
      required: true,
      min: [0, 'لا يمكن أن يكون رصيد الطيور بالسالب'],
    },
    total_dead_birds: { type: Number, default: 0, min: 0 },
    
    total_feed_consumed: { type: Number, default: 0, min: 0 }, // إجمالي شكاير العلف
    total_eggs_produced: { type: Number, default: 0, min: 0 }, // إجمالي البيض (للبياض)
  },
  { timestamps: true }
);

cycleSchema.index({ farm_id: 1, status: 1 });
cycleSchema.index(
  { barn_id: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'ACTIVE' },
  }
);

module.exports = mongoose.model('Cycle', cycleSchema);