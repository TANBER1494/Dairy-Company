const dashboardService = require('../services/dashboardService');
const asyncHandler = require('../utils/asyncHandler');

const getDashboardSummary = asyncHandler(async (req, res) => {
  const summary = await dashboardService.getSummary(req.query);
  
  res.status(200).json({
    message: 'تم استخراج بيانات لوحة القيادة بنجاح',
    data: summary
  });
});

module.exports = {
  getDashboardSummary
};