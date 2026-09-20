const dashboardService = require('../services/dashboardService');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Get quick summary for the Supervisor's Home Screen
 * @route   GET /api/dashboard/supervisor
 * @access  Private (Supervisor)
 */
const getSupervisorDashboard = asyncHandler(async (req, res, next) => {
  const farmId = req.user.farm_id; 

  const dashboardData = await dashboardService.getSupervisorSummary(farmId);

  res.status(200).json(dashboardData);
});

module.exports = { getSupervisorDashboard };