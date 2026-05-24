const Facility = require('../models/Facility');
const Inspection = require('../models/Inspection');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

exports.getFacilities = async (req, res) => {
  try {
    const currentQuarter = getCurrentQuarter();
    const facilities = await Facility.find().lean();
    
    // Get the most recent inspection for each facility using aggregation
    const latestInspections = await Inspection.aggregate([
      { $sort: { createdAt: -1 } },
      { $group: { _id: "$facility", latest: { $first: "$$ROOT" } } }
    ]);
    
    const inspectionMap = {};
    for (const item of latestInspections) {
      inspectionMap[item._id.toString()] = item.latest;
    }

    const enrichedFacilities = facilities.map(fac => {
      const facId = fac._id.toString();
      const latestInspection = inspectionMap[facId] || null;
      
      // Attach the facility object to the inspection so InspectionDetailModal can use it
      if (latestInspection) {
        latestInspection.facility = fac;
      }
      
      const isInspected = latestInspection ? latestInspection.quarter === currentQuarter : false;
      
      return {
        ...fac,
        isInspected,
        latestInspection
      };
    });

    res.json(enrichedFacilities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createFacility = async (req, res) => {
  try {
    const { name, region, coordinates, baseItems } = req.body;
    
    const facility = new Facility({
      name,
      region,
      location: {
        type: 'Point',
        coordinates: coordinates && coordinates.length === 2 ? coordinates : [0, 0]
      },
      baseItems: baseItems || {}
    });

    await facility.save();
    res.status(201).json(facility);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateFacility = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, region, coordinates, baseItems } = req.body;
    
    const facility = await Facility.findById(id);
    if (!facility) return res.status(404).json({ error: 'Facility not found' });

    if (name) facility.name = name;
    if (region) facility.region = region;
    if (coordinates && coordinates.length === 2) {
      facility.location = {
        type: 'Point',
        coordinates
      };
    }
    if (baseItems) {
      facility.baseItems = { ...facility.baseItems, ...baseItems };
    }

    await facility.save();
    res.json(facility);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteFacility = async (req, res) => {
  try {
    const { id } = req.params;
    const facility = await Facility.findByIdAndDelete(id);
    if (!facility) return res.status(404).json({ error: 'Facility not found' });
    
    // Delete related inspections to maintain referential integrity
    await Inspection.deleteMany({ facility: id });

    res.json({ message: 'Facility and related inspections deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getFacilityInspections = async (req, res) => {
  try {
    const { facilityId } = req.params;
    const inspections = await Inspection.find({ facility: facilityId })
      .sort({ createdAt: -1 })
      .lean();
    res.json(inspections);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getDashboardSummary = async (req, res) => {
  try {
    const totalFacilities = await Facility.countDocuments();
    const currentQuarter = getCurrentQuarter();
    const recentInspections = await Inspection.find({ quarter: currentQuarter })
      .populate('facility')
      .sort({ createdAt: -1 })
      .limit(10);
    
    const inspectedFacilities = await Inspection.distinct('facility', { quarter: currentQuarter });
    const inspectionsCount = inspectedFacilities.length;

    // Get the most recent inspection for each facility using aggregation
    const latestInspections = await Inspection.aggregate([
      { $sort: { createdAt: -1 } },
      { $group: { _id: "$facility", latest: { $first: "$$ROOT" } } }
    ]);

    const equipmentStats = {
      lifebuoy: { good: 0, bad: 0, none: 0 },
      lifeJacket: { good: 0, bad: 0, none: 0 },
      lifeline: { good: 0, bad: 0, none: 0 },
      throwBag: { good: 0, bad: 0, none: 0 }
    };

    latestInspections.forEach(item => {
      const status = item.latest.itemsStatus || {};
      
      const lifebuoyVal = status.lifebuoy || '양호';
      const lifeJacketVal = status.lifeJacket || '양호';
      const lifelineVal = status.lifeline || '양호';
      const throwBagVal = status.throwBag || '양호';

      // lifebuoy
      if (lifebuoyVal === '양호') equipmentStats.lifebuoy.good++;
      else if (lifebuoyVal === '불량') equipmentStats.lifebuoy.bad++;
      else if (lifebuoyVal === '없음') equipmentStats.lifebuoy.none++;
      
      // lifeJacket
      if (lifeJacketVal === '양호') equipmentStats.lifeJacket.good++;
      else if (lifeJacketVal === '불량') equipmentStats.lifeJacket.bad++;
      else if (lifeJacketVal === '없음') equipmentStats.lifeJacket.none++;
      
      // lifeline
      if (lifelineVal === '양호') equipmentStats.lifeline.good++;
      else if (lifelineVal === '불량') equipmentStats.lifeline.bad++;
      else if (lifelineVal === '없음') equipmentStats.lifeline.none++;
      
      // throwBag
      if (throwBagVal === '양호') equipmentStats.throwBag.good++;
      else if (throwBagVal === '불량') equipmentStats.throwBag.bad++;
      else if (throwBagVal === '없음') equipmentStats.throwBag.none++;
    });

    res.json({
      totalFacilities,
      inspectionsCount,
      recentInspections,
      currentQuarter,
      equipmentStats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createInspection = async (req, res) => {
  try {
    const { facilityId } = req.params;
    const { affiliation, inspectorName, itemsStatus, notes } = req.body;
    
    let externalPhotoPath = '';
    let internalPhotoPath = '';
    
    if (req.files && req.files['externalPhoto'] && req.files['internalPhoto']) {
      const processImage = async (fileBuffer, originalname) => {
        const filename = `optimized-${Date.now()}-${originalname}`;
        const outputPath = path.join(__dirname, '..', 'uploads', filename);
        await sharp(fileBuffer)
          .resize({ width: 800, withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toFile(outputPath);
        return `/uploads/${filename}`;
      };

      externalPhotoPath = await processImage(req.files['externalPhoto'][0].buffer, req.files['externalPhoto'][0].originalname);
      internalPhotoPath = await processImage(req.files['internalPhoto'][0].buffer, req.files['internalPhoto'][0].originalname);
    } else {
      return res.status(400).json({ error: 'External and Internal photos are required for inspection' });
    }

    const currentQuarter = getCurrentQuarter();

    // Parse itemsStatus if sent as string from form-data
    let parsedStatus = {};
    try {
      parsedStatus = typeof itemsStatus === 'string' ? JSON.parse(itemsStatus) : itemsStatus;
    } catch (e) {
      parsedStatus = {};
    }

    const inspection = new Inspection({
      facility: facilityId,
      affiliation,
      inspectorName,
      quarter: currentQuarter,
      itemsStatus: parsedStatus,
      externalPhotoPath,
      internalPhotoPath,
      notes
    });

    await inspection.save();
    res.status(201).json(inspection);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateInspection = async (req, res) => {
  try {
    const { id } = req.params;
    const { affiliation, inspectorName, itemsStatus, notes } = req.body;
    
    const inspection = await Inspection.findById(id);
    if (!inspection) return res.status(404).json({ error: 'Inspection not found' });

    let externalPhotoPath = inspection.externalPhotoPath;
    let internalPhotoPath = inspection.internalPhotoPath;

    if (req.files) {
      const processImage = async (fileBuffer, originalname) => {
        const filename = `optimized-${Date.now()}-${originalname}`;
        const outputPath = path.join(__dirname, '..', 'uploads', filename);
        await sharp(fileBuffer)
          .resize({ width: 800, withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toFile(outputPath);
        return `/uploads/${filename}`;
      };

      if (req.files['externalPhoto']) {
        externalPhotoPath = await processImage(req.files['externalPhoto'][0].buffer, req.files['externalPhoto'][0].originalname);
      }
      if (req.files['internalPhoto']) {
        internalPhotoPath = await processImage(req.files['internalPhoto'][0].buffer, req.files['internalPhoto'][0].originalname);
      }
    }

    let parsedStatus = inspection.itemsStatus;
    if (itemsStatus) {
      try {
        parsedStatus = typeof itemsStatus === 'string' ? JSON.parse(itemsStatus) : itemsStatus;
      } catch (e) {
        parsedStatus = inspection.itemsStatus;
      }
    }

    inspection.affiliation = affiliation || inspection.affiliation;
    inspection.inspectorName = inspectorName || inspection.inspectorName;
    inspection.itemsStatus = parsedStatus;
    inspection.notes = notes !== undefined ? notes : inspection.notes;
    inspection.externalPhotoPath = externalPhotoPath;
    inspection.internalPhotoPath = internalPhotoPath;

    await inspection.save();
    res.json(inspection);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteInspection = async (req, res) => {
  try {
    const { id } = req.params;
    const inspection = await Inspection.findByIdAndDelete(id);
    if (!inspection) return res.status(404).json({ error: 'Inspection not found' });
    res.json({ message: 'Inspection deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Helper function to get current quarter
function getCurrentQuarter() {
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-11
  const quarter = Math.floor(month / 3) + 1;
  return `${year}-Q${quarter}`;
}
