const express = require('express');
const router = express.Router();
const multer = require('multer');

const categoryController = require('../controllers/categoryController');
const facilityController = require('../controllers/facilityController');
const fireWaterController = require('../controllers/fireWaterController');
const vehicleController = require('../controllers/vehicleController');
const drowningRiskController = require('../controllers/drowningRiskController');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const { protect } = require('../middlewares/authMiddleware');

const geojeTransportRoutes = require('./geojeTransportRoutes');

// Multer setup for memory storage so sharp/xlsx can process it directly
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Mount sub-routers
router.use('/auth', authRoutes);
router.use('/geoje-transport', geojeTransportRoutes); // Unprotected Public Route for Geoje Transport Roster
router.use('/users', protect, userRoutes);

// Protected Routes
router.use(protect);

// Drowning Accident Risk Layer Route
router.get('/drowning-risks', drowningRiskController.getDrowningRisks);

// Category Routes
router.get('/categories', categoryController.getCategories);

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

// Fire Vehicle Routes
router.get('/vehicles', vehicleController.getVehicles);
router.post('/vehicles', vehicleController.createVehicle);
router.put('/vehicles/:id', vehicleController.updateVehicle);
router.delete('/vehicles/:id', vehicleController.deleteVehicle);
router.get('/vehicles/dashboard-summary', vehicleController.getVehicleDashboardSummary);

router.get('/vehicles/logs', vehicleController.getVehicleLogs);
router.post('/vehicles/logs', vehicleController.createVehicleLog);

router.get('/vehicles/maintenances', vehicleController.getVehicleMaintenances);
router.post('/vehicles/maintenances', upload.single('photo'), vehicleController.createVehicleMaintenance);

router.post('/vehicles/import-excel', upload.single('excel'), vehicleController.uploadVehicleExcel);
router.get('/vehicles/export-excel', vehicleController.downloadVehicleExcel);
router.get('/vehicles/export-logs-excel', vehicleController.downloadVehicleLogsExcel);

module.exports = router;
