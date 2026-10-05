const dashboardService = require('../services/dashboardService');
const asyncHandler = require('../utils/asyncHandler');

const getDashboardSummary = asyncHandler(async (req, res) => {
  const summary = await dashboardService.getSummary(req.query);
  
  res.status(200).json({
    message: 'تم استخراج بيانات لوحة القيادة بنجاح',
    data: summary
  });
});

const getDailyCollectionReport = asyncHandler(async (req, res) => {
  const report = await dashboardService.getDailyCollectionReport(req.query);
  
  res.status(200).json({
    message: 'تم استخراج تقرير التوريد اليومي بنجاح',
    data: report
  });
});

const runManualArchive = asyncHandler(async (req, res) => {
  const date = req.body?.date || req.query?.date; 
  
  const report = await dashboardService.forceArchive(date);
  
  res.status(200).json({
    message: `تم أرشفة يوم ${report.date_string} وتجميد حالته بنجاح`,
    data: report
  });
});

module.exports = {
  getDashboardSummary,
  getDailyCollectionReport,
  runManualArchive
};