const multer = require('multer');

const storage = multer.memoryStorage();
const limits = { fileSize: 5 * 1024 * 1024 }; // 5MB per file

const fileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith('image/')) return cb(new Error('Only images allowed'), false);
  cb(null, true);
};

const upload = multer({ storage, limits, fileFilter });

module.exports = upload;
