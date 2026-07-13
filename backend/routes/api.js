const express = require('express');
const router = express.Router();
const multer = require('multer');
const facilityController = require('../controllers/facilityController');
const fireWaterController = require('../controllers/fireWaterController');

// Multer setup for memory storage so sharp/xlsx can process it directly
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

// Fire Water Routes
router.get('/fire-waters', fireWaterController.getFireWaterList);
router.post('/fire-waters', fireWaterController.createFireWater);
router.put('/fire-waters/:id', fireWaterController.updateFireWater);
router.delete('/fire-waters/:id', fireWaterController.deleteFireWater);
router.get('/fire-waters/dashboard-summary', fireWaterController.getFireWaterDashboardSummary);

router.get('/fire-waters/:fireWaterId/inspections', fireWaterController.getFireWaterInspections);
router.post('/fire-waters/:fireWaterId/inspections', upload.fields([
  { name: 'externalPhoto', maxCount: 1 },
  { name: 'internalPhoto', maxCount: 1 }
]), fireWaterController.createFireWaterInspection);

router.put('/fire-waters/inspections/:id', upload.fields([
  { name: 'externalPhoto', maxCount: 1 },
  { name: 'internalPhoto', maxCount: 1 }
]), fireWaterController.updateFireWaterInspection);

router.delete('/fire-waters/inspections/:id', fireWaterController.deleteInspection);

// Excel Upload/Download for Fire Water
router.post('/fire-waters/import-excel', upload.single('excel'), fireWaterController.uploadFireWaterExcel);
router.get('/fire-waters/export-excel', fireWaterController.downloadFireWaterExcel);
router.get('/fire-waters/export-results-excel', fireWaterController.downloadFireWaterResultsExcel);

module.exports = router;

