const express = require('express');
const router = express.Router();
const multer = require('multer');
const facilityController = require('../controllers/facilityController');

// Multer setup for memory storage so sharp can process it directly
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Routes
// Category Routes
router.get('/categories', facilityController.getCategories);

// Facility Routes
router.get('/facilities', facilityController.getFacilities);
router.post('/facilities', facilityController.createFacility);
router.put('/facilities/:id', facilityController.updateFacility);
router.delete('/facilities/:id', facilityController.deleteFacility);
router.get('/dashboard-summary', facilityController.getDashboardSummary);

// Upload photo as part of inspection
router.get('/facilities/:facilityId/inspections', facilityController.getFacilityInspections);
router.post('/facilities/:facilityId/inspections', upload.fields([
  { name: 'externalPhoto', maxCount: 1 },
  { name: 'internalPhoto', maxCount: 1 }
]), facilityController.createInspection);

router.put('/inspections/:id', upload.fields([
  { name: 'externalPhoto', maxCount: 1 },
  { name: 'internalPhoto', maxCount: 1 }
]), facilityController.updateInspection);

router.delete('/inspections/:id', facilityController.deleteInspection);

module.exports = router;
