const inventoryService = require('../services/inventoryService');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

/**
 * @desc    Create a new inventory item card (Idempotent)
 * @route   POST /api/inventory/items
 * @access  Private (Supervisor)
 */
const addInventoryItem = asyncHandler(async (req, res, next) => {
  const { local_id, name, category, unit, min_alert_level, unloading_cost } = req.body;
  const farmId = req.user.farm_id;

  if (!local_id || !name || !category || !unit) {
    return next(new AppError('البيانات الأساسية للصنف مطلوبة (local_id, الاسم، التصنيف، الوحدة)', 400));
  }

  const result = await inventoryService.addInventoryItem({
    local_id, 
    farm_id: farmId, 
    name, 
    category, 
    unit, 
    min_alert_level,
    unloading_cost
  });

  res.status(201).json({
    message: result.isDuplicate ? 'تمت المزامنة مسبقاً' : 'تم إضافة الصنف للمخزن بنجاح',
    item: result.item,
  });
});

/**
 * @desc    Get all active inventory items for supervisor's farm
 * @route   GET /api/inventory/items
 * @access  Private (Supervisor)
 */
const getInventoryItems = asyncHandler(async (req, res, next) => {
  const farmId = req.user.farm_id;

  const items = await inventoryService.getInventoryItems(farmId);
  res.status(200).json({ count: items.length, items });
});

/**
 * @desc    Record an inventory movement (Purchase, Production, Adjustment)
 * @route   POST /api/inventory/movements
 * @access  Private (Supervisor)
 */
const recordInventoryMovement = asyncHandler(async (req, res, next) => {
  const {
    local_id, item_id, movement_type, quantity, unit_cost_at_time, movement_date,
  } = req.body;

  const farmId = req.user.farm_id;

  if (!local_id || !item_id || !movement_type || !quantity || !unit_cost_at_time || !movement_date) {
    return next(new AppError('البيانات الأساسية للحركة المخزنية غير مكتملة', 400));
  }

  const result = await inventoryService.recordMovement({
    ...req.body, farm_id: farmId
  }, req.user._id);

  res.status(201).json({
    message: result.isDuplicate ? 'الحركة مسجلة مسبقاً' : 'تم تسجيل الحركة وتحديث الأرصدة بنجاح',
    movement: result.movement,
  });
});

/**
 * @desc    Get movement history (Ledger) for a specific item
 * @route   GET /api/inventory/movements/item/:item_id
 * @access  Private (Supervisor)
 */
const getItemMovements = asyncHandler(async (req, res, next) => {
  const farmId = req.user.farm_id;
  const movements = await inventoryService.getItemMovements(req.params.item_id, farmId);
  
  res.status(200).json({ count: movements.length, movements });
});

/**
 * @desc    Update an inventory item
 * @route   PUT /api/inventory/items/:id
 * @access  Private (Supervisor)
 */
const updateInventoryItem = asyncHandler(async (req, res, next) => {
  const item = await inventoryService.updateInventoryItem(req.params.id, req.user.farm_id, req.body);
  res.status(200).json({ message: 'تم تحديث بيانات الصنف بنجاح', item });
});

/**
 * @desc    Soft delete an inventory item
 * @route   DELETE /api/inventory/items/:id
 * @access  Private (Supervisor)
 */
const deleteInventoryItem = asyncHandler(async (req, res, next) => {
  await inventoryService.deleteInventoryItem(req.params.id, req.user.farm_id);
  res.status(200).json({ message: 'تم أرشفة الصنف من المخزن بنجاح' });
});

/**
 * @desc    Produce feed from local feed mill
 * @route   POST /api/inventory/produce-feed
 * @access  Private (Supervisor)
 */
const produceFeed = asyncHandler(async (req, res, next) => {
  const { local_id, item_id, quantity, unit_cost } = req.body;
  const farmId = req.user.farm_id;
  
  if (!local_id || !item_id || !quantity || !unit_cost) {
    return next(new AppError('بيانات الإنتاج غير مكتملة', 400));
  }

  const result = await inventoryService.produceFeed(req.body, farmId, req.user._id);
  
  res.status(201).json({ 
    message: result.isDuplicate ? 'تمت مزامنة عملية الإنتاج مسبقاً' : 'تم إنتاج العلف وإضافته للمخزن بنجاح', 
    result: result.movement 
  });
});

/**
 * @desc    Record Dokhan (Unloading raw materials)
 * @route   POST /api/inventory/dokhan
 * @access  Private (Supervisor)
 */
const recordDokhan = asyncHandler(async (req, res, next) => {
  const result = await inventoryService.recordDokhan(req.body, req.user.farm_id, req.user._id);
  
  res.status(201).json({ 
    message: result.isDuplicate ? 'تمت مزامنة عملية الدخان مسبقاً' : 'تم تسجيل الدخان وتحديث رصيد المخزن بنجاح', 
    result: result.movement 
  });
});

/**
 * @desc    Update Dokhan record (Only allowed on the same creation day)
 * @route   PUT /api/inventory/dokhan/:id
 * @access  Private (Supervisor)
 */
const updateDokhan = asyncHandler(async (req, res, next) => {
  const updatedMovement = await inventoryService.updateDokhan(
    req.params.id, 
    req.user.farm_id, 
    req.body
  );
  
  res.status(200).json({ 
    message: 'تم تعديل سجل الدخان وتحديث رصيد المخزن بنجاح', 
    movement: updatedMovement 
  });
});

module.exports = {
  addInventoryItem,
  getInventoryItems,
  recordInventoryMovement,
  getItemMovements,
  updateInventoryItem,
  deleteInventoryItem,
  produceFeed,
  recordDokhan,
  updateDokhan,
};