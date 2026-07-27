const express = require('express');
const router = express.Router();

const categoryRoutes = require('./categoryRoutes');
const facilityRoutes = require('./facilityRoutes');
const fireWaterRoutes = require('./fireWaterRoutes');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const { protect } = require('../middlewares/authMiddleware');

// Mount sub-routers to maintain the same URL structure
router.use('/auth', authRoutes);
router.use('/users', protect, userRoutes);
router.use('/', protect, categoryRoutes);
router.use('/', protect, facilityRoutes);
router.use('/', protect, fireWaterRoutes);

module.exports = router;

