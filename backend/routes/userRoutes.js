const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, isAdmin } = require('../middlewares/authMiddleware');

// Profile routes (requires authentication)
router.get('/profile', protect, userController.getUserProfile);
router.put('/profile', protect, userController.updateUserProfile);

// Admin-only user management routes
router.get('/', protect, isAdmin, userController.getAllUsers);
router.get('/login-history', protect, isAdmin, userController.getLoginHistory);
router.get('/login-frequency', protect, isAdmin, userController.getLoginFrequency);
router.get('/:id', protect, isAdmin, userController.getUserById);
router.put('/:id', protect, isAdmin, userController.updateUser);

module.exports = router;
