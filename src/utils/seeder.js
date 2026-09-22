const xlsx = require('xlsx');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');

const Supplier = require('../models/Supplier');
const Client = require('../models/Client');
const Product = require('../models/Product');
const User = require('../models/User');
const Worker = require('../models/Worker');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const seedDatabase = async () => {
  try {
    console.log('⏳ جاري الاتصال بقاعدة البيانات...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ تم الاتصال بنجاح.');

    await Supplier.deleteMany();
    await Client.deleteMany();
    await Product.deleteMany();
    await User.deleteMany();
    await Worker.deleteMany();
    console.log('🧹 تم تنظيف الجداول بالكامل.');

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash('admin123456', salt);

    const usersData = [
      {
        name: 'مدير النظام',
        username: 'admin',
        password_hash,
        role: 'Admin',
        phone: '01000000000',
      },
      {
        name: 'محاسب عام',
        username: 'acc',
        password_hash,
        role: 'GeneralAccountant',
        phone: '01111111111',
      },
    ];
    await User.insertMany(usersData);
    console.log(
      '✅ تم إنشاء حسابات النظام (admin, acc) بكلمة مرور: admin123456'
    );

    const workersData = [
      { name: 'عامل توصيل 1', phone: '01222222222' },
      { name: 'عامل توصيل 2', phone: '01555555555' },
    ];
    await Worker.insertMany(workersData);
    console.log('✅ تم إضافة العمال والمناديب بنجاح.');

    const filePath = path.join(__dirname, '../../سيستم المعمل جديد.xlsx');
    const workbook = xlsx.readFile(filePath);
    const sheetNames = workbook.SheetNames;

    const productsSheet = sheetNames.find((s) => s.includes('المنتجات'));
    const suppliersSheet = sheetNames.find(
      (s) => s.includes('الموردين') && s.includes('اكواد')
    );
    const clientsSheet = sheetNames.find(
      (s) => s.includes('المحلات') && s.includes('اكواد')
    );

    const parseSheet = (sheetName) => {
      if (!sheetName) return [];
      const sheet = workbook.Sheets[sheetName];
      const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

      return rows.filter((row) => {
        const firstCell = row[0];
        return (
          firstCell !== undefined &&
          firstCell !== null &&
          firstCell !== '' &&
          !isNaN(Number(firstCell))
        );
      });
    };

    let productsData = parseSheet(productsSheet)
      .filter((row) => row[1] && String(row[1]).trim() !== '')
      .map((row) => ({
        code: Number(row[0]),
        name: String(row[1]).trim(),
        current_price: 0,
        current_stock: 0,
      }));
    productsData = Array.from(new Map(productsData.map(item => [item.code, item])).values());
    if (productsData.length) await Product.insertMany(productsData);
    console.log(`✅ تم زراعة ${productsData.length} منتج.`);

    let suppliersData = parseSheet(suppliersSheet)
      .filter((row) => row[1] && String(row[1]).trim() !== '')
      .map((row) => ({
        code: Number(row[0]),
        name: String(row[1]).trim(),
        address: row[2] ? String(row[2]).trim() : 'غير مسجل',
        phone: row[3] ? String(row[3]).trim() : 'غير مسجل',
        current_balance: 0,
      }));
    suppliersData = Array.from(new Map(suppliersData.map(item => [item.code, item])).values());
    if (suppliersData.length) await Supplier.insertMany(suppliersData);
    console.log(`✅ تم زراعة ${suppliersData.length} مورد.`);

    let clientsData = parseSheet(clientsSheet)
      .filter((row) => row[1] && String(row[1]).trim() !== '')
      .map((row) => ({
        code: Number(row[0]),
        name: String(row[1]).trim(),
        address: row[2] ? String(row[2]).trim() : 'غير مسجل',
        phone: row[3] ? String(row[3]).trim() : 'غير مسجل',
        current_balance: 0,
      }));
    clientsData = Array.from(new Map(clientsData.map(item => [item.code, item])).values());
    if (clientsData.length) await Client.insertMany(clientsData);
    console.log(`✅ تم زراعة ${clientsData.length} عميل (محل).`);

    console.log(
      '🎉 تمت عملية الزراعة بالكامل بنجاح! يمكنك تشغيل السيرفر وتسليم المشروع الآن.'
    );
    process.exit();
  } catch (error) {
    console.error('❌ حدث خطأ أثناء الزراعة:', error);
    process.exit(1);
  }
};

seedDatabase();