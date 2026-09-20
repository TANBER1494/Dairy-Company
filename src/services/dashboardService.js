const Cycle = require('../models/Cycle');
const InventoryItem = require('../models/InventoryItem');
const Invoice = require('../models/Invoice');

class DashboardService {
  
  async getSupervisorSummary(farmId) {
    
    const [activeCycles, lowStockItems, debtsAggregation] = await Promise.all([
      
      Cycle.find({ farm_id: farmId, status: 'ACTIVE' })
        .populate('barn_id', 'name')
        .select('name type current_bird_count start_date barn_id')
        .lean(),

      InventoryItem.find({ 
        farm_id: farmId, 
        deleted_at: null, 
        min_alert_level: { $gt: 0 }, 
        $expr: { $lte: ['$stock_quantity', '$min_alert_level'] } 
      })
      .select('name category stock_quantity min_alert_level unit')
      .lean(),

      Invoice.aggregate([
        { 
          $match: { 
            farm_id: farmId, 
            payment_status: { $ne: 'PAID' } 
          } 
        },
        {
          $group: {
            _id: null,
            debts_for_us: { 
              $sum: { $cond: [{ $eq: ['$invoice_type', 'SALE'] }, '$remaining_amount', 0] } 
            },
            debts_on_us: { 
              $sum: { $cond: [{ $eq: ['$invoice_type', 'PURCHASE'] }, '$remaining_amount', 0] } 
            }
          }
        }
      ])
    ]);

    return {
      active_cycles_count: activeCycles.length,
      active_cycles: activeCycles,
      low_stock_count: lowStockItems.length,
      low_stock_alerts: lowStockItems,
      financial_summary: {
        debts_for_us: debtsAggregation[0]?.debts_for_us || 0,
        debts_on_us: debtsAggregation[0]?.debts_on_us || 0,
      }
    };
  }
}

module.exports = new DashboardService();