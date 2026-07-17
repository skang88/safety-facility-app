const express = require('express');
const router = express.Router();
const fireWaterController = require('../controllers/fireWaterController');
const upload = require('../middlewares/upload');

// Fire Water Routes
router.get('/fire-waters', fireWaterController.getFireWaterList);
router.post('/fire-waters', fireWaterController.createFireWater);
router.put('/fire-waters/:id', fireWaterController.updateFireWater);
router.delete('/fire-waters/:id', fireWaterController.deleteFireWater);
router.get('/fire-waters/dashboard-summary', fireWaterController.getFireWaterDashboardSummary);

// Fire Water Inspection Routes
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

// Excel Import/Export Routes
router.post('/fire-waters/import-excel', upload.single('excel'), fireWaterController.uploadFireWaterExcel);
router.get('/fire-waters/export-excel', fireWaterController.downloadFireWaterExcel);
router.get('/fire-waters/export-results-excel', fireWaterController.downloadFireWaterResultsExcel);

module.exports = router;
