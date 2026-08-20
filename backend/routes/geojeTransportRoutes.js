const express = require('express');
const router = express.Router();
const geojeTransportController = require('../controllers/geojeTransportController');

// All routes here are strictly PUBLIC (no login token required)
router.get('/monthly', geojeTransportController.getMonthlyRoster);
router.get('/day/:date', geojeTransportController.getDayRoster);
router.post('/slot/:date', geojeTransportController.upsertSlot);
router.post('/cancel/:date', geojeTransportController.cancelSlot);
router.put('/meta/:date', geojeTransportController.updateRosterMeta);

module.exports = router;
