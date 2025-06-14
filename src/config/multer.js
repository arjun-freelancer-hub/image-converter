const multer = require('multer');
const config = require('./index');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    if (config.allowedImageTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type for ${file.originalname}. Only PNG, JPEG, GIF, WEBP, BMP, and TIFF are allowed.`));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    }
});

module.exports = upload; 