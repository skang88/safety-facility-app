const FireWater = require('../models/FireWater');
const FireWaterInspection = require('../models/FireWaterInspection');
const { getCurrentQuarter } = require('../utils/dateHelper');
const { processAndSaveImage } = require('../utils/imageProcessor');
const { 
  parseFireWaterExcel, 
  generateFireWaterExcel, 
  generateFireWaterResultsExcel 
} = require('../utils/excelHelper');

// Get all fire water list with latest inspection in current quarter
exports.getFireWaterList = async (req, res) => {
  try {
    const currentQuarter = getCurrentQuarter();
    const list = await FireWater.find().lean();
    
    // Get the most recent inspection for each fire water using aggregation
    const latestInspections = await FireWaterInspection.aggregate([
      { $sort: { createdAt: -1 } },
      { $group: { _id: "$fireWater", latest: { $first: "$$ROOT" } } }
    ]);
    
    const inspectionMap = {};
    for (const item of latestInspections) {
      inspectionMap[item._id.toString()] = item.latest;
    }

    const enrichedList = list.map(item => {
      const idStr = item._id.toString();
      const latestInspection = inspectionMap[idStr] || null;
      
      if (latestInspection) {
        latestInspection.fireWater = item;
      }
      
      const isInspected = latestInspection ? latestInspection.quarter === currentQuarter : false;
      
      return {
        ...item,
        isInspected,
        latestInspection
      };
    });

    res.json(enrichedList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create fire water target
exports.createFireWater = async (req, res) => {
  try {
    const { serialNumber, name, type, region, address, coordinates, diameter, installDate, details } = req.body;
    
    const fireWater = new FireWater({
      serialNumber,
      name,
      type,
      region,
      address,
      location: {
        type: 'Point',
        coordinates: coordinates && coordinates.length === 2 ? coordinates : [128.2570, 35.3168]
      },
      diameter: diameter || '',
      installDate: installDate || '',
      details: details || ''
    });

    await fireWater.save();
    res.status(201).json(fireWater);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update fire water target
exports.updateFireWater = async (req, res) => {
  try {
    const { id } = req.params;
    const { serialNumber, name, type, region, address, coordinates, diameter, installDate, details } = req.body;
    
    const fireWater = await FireWater.findById(id);
    if (!fireWater) return res.status(404).json({ error: 'FireWater not found' });

    if (serialNumber !== undefined) fireWater.serialNumber = serialNumber;
    if (name !== undefined) fireWater.name = name;
    if (type !== undefined) fireWater.type = type;
    if (region !== undefined) fireWater.region = region;
    if (address !== undefined) fireWater.address = address;
    if (coordinates && coordinates.length === 2) {
      fireWater.location = {
        type: 'Point',
        coordinates
      };
    }
    if (diameter !== undefined) fireWater.diameter = diameter;
    if (installDate !== undefined) fireWater.installDate = installDate;
    if (details !== undefined) fireWater.details = details;

    await fireWater.save();
    res.json(fireWater);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete fire water target
exports.deleteFireWater = async (req, res) => {
  try {
    const { id } = req.params;
    const fireWater = await FireWater.findByIdAndDelete(id);
    if (!fireWater) return res.status(404).json({ error: 'FireWater not found' });
    
    // Delete inspections
    await FireWaterInspection.deleteMany({ fireWater: id });

    res.json({ message: 'FireWater and related inspections deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get inspections list for specific fire water
exports.getFireWaterInspections = async (req, res) => {
  try {
    const { fireWaterId } = req.params;
    const inspections = await FireWaterInspection.find({ fireWater: fireWaterId })
      .sort({ createdAt: -1 })
      .lean();
    res.json(inspections);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create fire water inspection
exports.createFireWaterInspection = async (req, res) => {
  try {
    const { fireWaterId } = req.params;
    const { affiliation, inspectorName, itemsStatus, notes } = req.body;
    
    let externalPhotoPath = '';
    let internalPhotoPath = '';
    
    if (req.files && req.files['externalPhoto'] && req.files['internalPhoto']) {
      const extFile = req.files['externalPhoto'][0];
      const intFile = req.files['internalPhoto'][0];
      externalPhotoPath = await processAndSaveImage(extFile.buffer, extFile.originalname, 'fw');
      internalPhotoPath = await processAndSaveImage(intFile.buffer, intFile.originalname, 'fw');
    } else {
      return res.status(400).json({ error: 'External and Internal photos are required for inspection' });
    }

    const currentQuarter = getCurrentQuarter();

    let parsedStatus = {};
    try {
      parsedStatus = typeof itemsStatus === 'string' ? JSON.parse(itemsStatus) : itemsStatus;
    } catch (e) {
      parsedStatus = {};
    }

    const inspection = new FireWaterInspection({
      fireWater: fireWaterId,
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

// Update fire water inspection
exports.updateFireWaterInspection = async (req, res) => {
  try {
    const { id } = req.params;
    const { affiliation, inspectorName, itemsStatus, notes } = req.body;
    
    const inspection = await FireWaterInspection.findById(id);
    if (!inspection) return res.status(404).json({ error: 'Inspection not found' });

    let externalPhotoPath = inspection.externalPhotoPath;
    let internalPhotoPath = inspection.internalPhotoPath;

    if (req.files) {
      if (req.files['externalPhoto']) {
        const file = req.files['externalPhoto'][0];
        externalPhotoPath = await processAndSaveImage(file.buffer, file.originalname, 'fw');
      }
      if (req.files['internalPhoto']) {
        const file = req.files['internalPhoto'][0];
        internalPhotoPath = await processAndSaveImage(file.buffer, file.originalname, 'fw');
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

// Delete fire water inspection
exports.deleteInspection = async (req, res) => {
  try {
    const { id } = req.params;
    const inspection = await FireWaterInspection.findByIdAndDelete(id);
    if (!inspection) return res.status(404).json({ error: 'Inspection not found' });
    res.json({ message: 'Inspection deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Excel upload and parse
exports.uploadFireWaterExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Excel file is required' });
    }

    const parsedData = parseFireWaterExcel(req.file.buffer);
    let importCount = 0;

    for (const item of parsedData) {
      // Find by name and region
      let fireWater = await FireWater.findOne({ name: item.name, region: item.region });
      if (!fireWater) {
        fireWater = new FireWater({
          serialNumber: item.serialNumber,
          name: item.name,
          type: item.type,
          region: item.region,
          address: item.address,
          location: {
            type: 'Point',
            coordinates: item.coordinates
          },
          diameter: item.diameter,
          installDate: item.installDate,
          details: item.details
        });
      } else {
        fireWater.serialNumber = item.serialNumber || fireWater.serialNumber;
        fireWater.type = item.type;
        fireWater.address = item.address;
        fireWater.location = {
          type: 'Point',
          coordinates: item.coordinates
        };
        fireWater.diameter = item.diameter || fireWater.diameter;
        fireWater.installDate = item.installDate || fireWater.installDate;
        fireWater.details = item.details || fireWater.details;
      }
      
      await fireWater.save();
      importCount++;
    }

    res.json({ message: `Successfully imported ${importCount} fire water facilities.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Download fire water targets list as Excel
exports.downloadFireWaterExcel = async (req, res) => {
  try {
    const list = await FireWater.find().sort({ region: 1, name: 1 }).lean();
    const buffer = generateFireWaterExcel(list);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=' + encodeURIComponent('소방용수_대상물_목록.xlsx'));
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Download fire water inspection results as Excel
exports.downloadFireWaterResultsExcel = async (req, res) => {
  try {
    const currentQuarter = getCurrentQuarter();
    const list = await FireWater.find().lean();
    
    // Get latest inspection in current quarter
    const latestInspections = await FireWaterInspection.aggregate([
      { $sort: { createdAt: -1 } },
      { $group: { _id: "$fireWater", latest: { $first: "$$ROOT" } } }
    ]);
    
    const inspectionMap = {};
    for (const item of latestInspections) {
      inspectionMap[item._id.toString()] = item.latest;
    }

    const buffer = generateFireWaterResultsExcel(list, inspectionMap, currentQuarter);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=' + encodeURIComponent(`소방용수_점검결과_${currentQuarter}.xlsx`));
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Dashboard Summary for fire water
exports.getFireWaterDashboardSummary = async (req, res) => {
  try {
    const totalFacilities = await FireWater.countDocuments();
    const currentQuarter = getCurrentQuarter();
    
    const recentInspections = await FireWaterInspection.find({ quarter: currentQuarter })
      .populate('fireWater')
      .sort({ createdAt: -1 })
      .limit(10);
    
    const inspectedFacilities = await FireWaterInspection.distinct('fireWater', { quarter: currentQuarter });
    const inspectionsCount = inspectedFacilities.length;

    // Get the most recent inspection for each fire water using aggregation
    const latestInspections = await FireWaterInspection.aggregate([
      { $sort: { createdAt: -1 } },
      { $group: { _id: "$fireWater", latest: { $first: "$$ROOT" } } }
    ]);

    const equipmentStats = {
      bodyStatus: { good: 0, bad: 0, none: 0 },
      signStatus: { good: 0, bad: 0, none: 0 },
      valveStatus: { good: 0, bad: 0, none: 0 },
      waterStatus: { good: 0, bad: 0, none: 0 }
    };

    latestInspections.forEach(item => {
      const status = item.latest.itemsStatus || {};
      
      const bodyVal = status.bodyStatus || '양호';
      const signVal = status.signStatus || '양호';
      const valveVal = status.valveStatus || '양호';
      const waterVal = status.waterStatus || '양호';

      // bodyStatus
      if (bodyVal === '양호') equipmentStats.bodyStatus.good++;
      else if (bodyVal === '불량') equipmentStats.bodyStatus.bad++;
      else if (bodyVal === '없음') equipmentStats.bodyStatus.none++;
      
      // signStatus
      if (signVal === '양호') equipmentStats.signStatus.good++;
      else if (signVal === '불량') equipmentStats.signStatus.bad++;
      else if (signVal === '없음') equipmentStats.signStatus.none++;
      
      // valveStatus
      if (valveVal === '양호') equipmentStats.valveStatus.good++;
      else if (valveVal === '불량') equipmentStats.valveStatus.bad++;
      else if (valveVal === '없음') equipmentStats.valveStatus.none++;
      
      // waterStatus
      if (waterVal === '양호') equipmentStats.waterStatus.good++;
      else if (waterVal === '불량') equipmentStats.waterStatus.bad++;
      else if (waterVal === '없음') equipmentStats.waterStatus.none++;
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
