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
  invoice_image: 'dairy_company/invoices',
  receipt_image: 'dairy_company/receipts',
  profile_picture: 'dairy_company/profiles', 
};

/**
 * Cloudinary storage configuration.
 * Dynamically assigns upload folder based on the field name.
 */
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const folderName = FOLDER_MAP[file.fieldname] || 'dairy_company/misc';
    const userId = req.user && req.user._id ? req.user._id.toString() : 'system';
    const publicId = `user-${userId}-${Date.now()}`;

    return {
      folder: folderName,
      resource_type: 'auto',
      public_id: publicId,
    };
  },
});

/**
 * File filter to restrict uploads to specific image types and PDFs.
 */
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];

  const isMimeValid = file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf';
  const isExtValid = allowedExts.includes(ext);

  if (isMimeValid && isExtValid) {
    cb(null, true);
  } else {
    cb(new AppError('Invalid file format. Only JPG, PNG, WEBP, and PDF files are allowed.', 400), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB Limit
});

module.exports = upload;