const mongoose = require('mongoose');

const dailyReportSchema = new mongoose.Schema({
  date_string: { 
    type: String, 
    required: true, 
    unique: true,
    description: "تاريخ التقرير بصيغة YYYY-MM-DD"
  },
  shift: { type: String, default: 'ALL' },
  totalActiveSuppliers: { type: Number, default: 0 },
  suppliedCount: { type: Number, default: 0 },
  pendingCount: { type: Number, default: 0 },
  supplied: { type: Array, default: [] }, 
  pending: { type: Array, default: [] }  
}, { timestamps: true });

module.exports = mongoose.model('DailyReport', dailyReportSchema);