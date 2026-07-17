const express = require('express');
const router = express.Router();
const facilityController = require('../controllers/facilityController');
const upload = require('../middlewares/upload');

// Facility Routes
router.get('/facilities', facilityController.getFacilities);
router.post('/facilities', facilityController.createFacility);
router.put('/facilities/:id', facilityController.updateFacility);
router.delete('/facilities/:id', facilityController.deleteFacility);
router.get('/dashboard-summary', facilityController.getDashboardSummary);

// Facility Inspection Routes
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
