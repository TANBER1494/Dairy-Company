const userService = require('../services/userService');
const asyncHandler = require('../utils/asyncHandler');

const createUser = asyncHandler(async (req, res) => {
  const user = await userService.createUser(req.body);
  res.status(201).json({ message: 'تم إنشاء حساب الموظف بنجاح', data: user });
});

const getAllUsers = asyncHandler(async (req, res) => {
  const users = await userService.getAllUsers();
  res.status(200).json({ count: users.length, data: users });
});

const updateUserStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const user = await userService.updateUserStatus(req.params.id, status);
  res.status(200).json({ message: 'تم تحديث حالة الحساب أمنياً بنجاح', data: user });
});

const resetUserPassword = asyncHandler(async (req, res) => {
  const { new_password } = req.body;
  await userService.resetUserPassword(req.params.id, new_password);
  res.status(200).json({ message: 'تم تغيير كلمة مرور الموظف بنجاح' });
});

const deleteUser = asyncHandler(async (req, res) => {
  await userService.softDeleteUser(req.params.id);
  res.status(200).json({ message: 'تم حذف حساب الموظف بنجاح (حذف مرن)' });
});

module.exports = { createUser, getAllUsers, updateUserStatus, resetUserPassword, deleteUser };