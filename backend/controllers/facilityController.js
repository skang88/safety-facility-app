const Facility = require('../models/Facility');
const Inspection = require('../models/Inspection');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

exports.getFacilities = async (req, res) => {
  try {
    const currentQuarter = getCurrentQuarter();
    const facilities = await Facility.find().lean();
    
    // Check which facilities have been inspected in the current quarter
    const inspectedFacilities = await Inspection.distinct('facility', { quarter: currentQuarter });
    const inspectedIds = inspectedFacilities.map(id => id.toString());

    const enrichedFacilities = facilities.map(fac => ({
      ...fac,
      isInspected: inspectedIds.includes(fac._id.toString())
    }));

    res.json(enrichedFacilities);
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

    res.json({
      totalFacilities,
      inspectionsCount,
      recentInspections
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
