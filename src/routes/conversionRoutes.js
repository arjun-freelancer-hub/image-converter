const express = require('express');
const router = express.Router();
const ConversionController = require('../controllers/conversionController');
const upload = require('../config/multer');

// Single file conversion
router.post('/convert-single', upload.single('file'), ConversionController.convertSingle);

// Batch conversion
router.post('/convert-batch', upload.array('files'), ConversionController.convertBatch);

// Get conversion results
router.get('/conversion-results', ConversionController.getConversionResults);

module.exports = router; 