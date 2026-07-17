const express = require('express');
const router = express.Router();

const categoryRoutes = require('./categoryRoutes');
const facilityRoutes = require('./facilityRoutes');
const fireWaterRoutes = require('./fireWaterRoutes');

// Mount sub-routers to maintain the same URL structure
router.use('/', categoryRoutes);
router.use('/', facilityRoutes);
router.use('/', fireWaterRoutes);

module.exports = router;
