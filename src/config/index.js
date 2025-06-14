const path = require('path');

module.exports = {
    port: process.env.PORT || 3000,
    uploadsDir: path.join(__dirname, '../../uploads'),
    allowedImageTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff'],
    supportedFormats: ['PNG', 'JPEG', 'WEBP', 'GIF', 'BMP', 'TIFF', 'JPG'],
    maxFileSize: '50mb',
    chunkSize: 10, // Number of files to process in parallel during batch conversion
    compressionLevel: 9 // Maximum compression for zip files
}; 