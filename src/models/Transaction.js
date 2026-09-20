const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    local_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    farm_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Farm',
      required: true,
      index: true,
    },
    worker_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Worker',
      default: null,
    },
    merchant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Merchant',
      default: null,
    },
    invoice_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
      default: null,
    },
    performed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', 
      required: true,
    },
    type: {
      type: String,
      enum: ['IN', 'OUT'], 
      required: true,
    },
    category: {
      type: String,
      enum: [
        'SAFE_DEPOSIT',    
        'EGG_SALE',        
        'MANURE_SALE',      
        'WORKER_ADVANCE',   
        'WORKER_SALARY',    
        'MERCHANT_PAYMENT', 
        'MAINTENANCE',      
        'TRANSPORTATION',   
        'OTHER_EXPENSE',    
      ],
      required: true,
    },
    amount: {
      type: Number,
      required: [true, 'يجب تحديد قيمة المعاملة'],
      min: [0.01, 'المبلغ يجب أن يكون أكبر من الصفر'],
    },
    transaction_date: {
      type: Date,
      required: true,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    reference_doc: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

transactionSchema.index({ farm_id: 1, transaction_date: -1 });
transactionSchema.index({ farm_id: 1, type: 1, category: 1 });
transactionSchema.index({ farm_id: 1, merchant_id: 1, transaction_date: -1 });
transactionSchema.index({ farm_id: 1, worker_id: 1, transaction_date: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);