const express = require('express');
const router = express.Router();
const homeRoutes = require('./homeRoutes');
const conversionRoutes = require('./conversionRoutes');

router.use('/', homeRoutes);
router.use('/', conversionRoutes);

module.exports = router; 