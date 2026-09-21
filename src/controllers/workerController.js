const workerService = require('../services/workerService');
const asyncHandler = require('../utils/asyncHandler');

const createWorker = asyncHandler(async (req, res) => {
  const worker = await workerService.createWorker(req.body);
  res.status(201).json({ message: 'تم إضافة العامل بنجاح', data: worker });
});

const getAllWorkers = asyncHandler(async (req, res) => {
  const filter = req.query.active ? { is_active: req.query.active === 'true' } : {};
  const workers = await workerService.getAllWorkers(filter);
  res.status(200).json({ count: workers.length, data: workers });
});

const getWorkerById = asyncHandler(async (req, res) => {
  const worker = await workerService.getWorkerById(req.params.id);
  res.status(200).json({ data: worker });
});

const updateWorker = asyncHandler(async (req, res) => {
  const worker = await workerService.updateWorker(req.params.id, req.body);
  res.status(200).json({ message: 'تم تحديث بيانات العامل بنجاح', data: worker });
});

const toggleWorkerStatus = asyncHandler(async (req, res) => {
  const worker = await workerService.toggleWorkerStatus(req.params.id);
  res.status(200).json({ message: `تم ${worker.is_active ? 'تنشيط' : 'إيقاف'} العامل بنجاح`, data: worker });
});

module.exports = { createWorker, getAllWorkers, getWorkerById, updateWorker, toggleWorkerStatus };