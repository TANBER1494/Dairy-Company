const clientService = require('../services/clientService');
const asyncHandler = require('../utils/asyncHandler');

const createClient = asyncHandler(async (req, res) => {
  const client = await clientService.createClient(req.body);
  res.status(201).json({ message: 'تم إضافة العميل بنجاح', data: client });
});

const getAllClients = asyncHandler(async (req, res) => {
  const clients = await clientService.getAllClients(req.query);
  res.status(200).json({ count: clients.length, data: clients });
});

const getClientById = asyncHandler(async (req, res) => {
  const client = await clientService.getClientById(req.params.id);
  res.status(200).json({ data: client });
});

const updateClient = asyncHandler(async (req, res) => {
  const client = await clientService.updateClient(req.params.id, req.body);
  res
    .status(200)
    .json({ message: 'تم تحديث بيانات العميل بنجاح', data: client });
});

const toggleClientStatus = asyncHandler(async (req, res) => {
  const client = await clientService.toggleClientStatus(req.params.id);
  res
    .status(200)
    .json({
      message: `تم ${client.is_active ? 'تنشيط' : 'إيقاف'} العميل بنجاح`,
      data: client,
    });
});

const getClientStatement = asyncHandler(async (req, res) => {
  const statement = await clientService.getClientStatement(req.params.key);
  res
    .status(200)
    .json({ message: 'تم استخراج كشف حساب العميل بنجاح', data: statement });
});

module.exports = {
  createClient,
  getAllClients,
  getClientById,
  updateClient,
  toggleClientStatus,
  getClientStatement,
};
