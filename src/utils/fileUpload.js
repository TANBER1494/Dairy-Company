const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const path = require('path');
const AppError = require('./AppError'); 

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const FOLDER_MAP = {
  invoice_image: 'farm_system/invoices',
  receipt_image: 'farm_system/receipts',
  profile_picture: 'farm_system/profiles', 
};

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const folderName = FOLDER_MAP[file.fieldname] || 'farm_system/misc';

    const farmId = req.user && req.user.farm_id ? req.user.farm_id : 'system';
    const publicId = `farm-${farmId}-${Date.now()}`;

    return {
      folder: folderName,
      resource_type: 'auto',
      public_id: publicId,
    };
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];

  const isMimeValid = file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf';
  const isExtValid = allowedExts.includes(ext);

  if (isMimeValid && isExtValid) {
    cb(null, true);
  } else {
    cb(new AppError('صيغة الملف غير صالحة! يرجى رفع صور (JPG, PNG) أو ملفات PDF فقط.', 400), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, 
});

module.exports = upload;