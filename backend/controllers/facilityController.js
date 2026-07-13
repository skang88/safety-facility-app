const Facility = require('../models/Facility');
const Inspection = require('../models/Inspection');
const Category = require('../models/Category');
const FireStation = require('../models/FireStation');
const Center = require('../models/Center');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// 1. Get Facilities
exports.getFacilities = async (req, res) => {
  try {
    const currentQuarter = getCurrentQuarter();
    const { fireStation, center, category, region } = req.query;

    const filter = {};
    if (fireStation) filter.fireStation = fireStation;
    if (center) filter.center = center;
    if (category) filter.category = category;
    if (region && region !== '전체') filter.region = region;

    const facilities = await Facility.find(filter)
      .populate('category fireStation center')
      .lean();
    
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

// 2. Create Facility
exports.createFacility = async (req, res) => {
  try {
    const { name, region, coordinates, baseItems, category, fireStation, center } = req.body;
    
    let finalCategory = category;
    let finalStation = fireStation;
    let finalCenter = center;

    if (!finalCategory) {
      const defaultCat = await Category.findOne({ key: 'water_rescue' });
      if (defaultCat) finalCategory = defaultCat._id;
    }
    if (!finalStation) {
      const defaultStation = await FireStation.findOne({ name: '의령소방서' });
      if (defaultStation) finalStation = defaultStation._id;
    }
    if (!finalCenter) {
      const defaultCenter = await Center.findOne({ name: `${region || '의령'}119안전센터` });
      if (defaultCenter) finalCenter = defaultCenter._id;
    }

    const facility = new Facility({
      name,
      region: region || '의령',
      category: finalCategory,
      fireStation: finalStation,
      center: finalCenter,
      location: {
        type: 'Point',
        coordinates: coordinates && coordinates.length === 2 ? coordinates : [0, 0]
      },
      baseItems: baseItems || {}
    });

    await facility.save();
    
    const populated = await Facility.findById(facility._id).populate('category fireStation center');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 3. Update Facility
exports.updateFacility = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, region, coordinates, baseItems, category, fireStation, center } = req.body;
    
    const facility = await Facility.findById(id);
    if (!facility) return res.status(404).json({ error: 'Facility not found' });

    if (name) facility.name = name;
    if (region) facility.region = region;
    if (category) facility.category = category;
    if (fireStation) facility.fireStation = fireStation;
    if (center) facility.center = center;
    
    if (coordinates && coordinates.length === 2) {
      facility.location = {
        type: 'Point',
        coordinates
      };
    }
    if (baseItems) {
      const currentItems = facility.baseItems || new Map();
      Object.keys(baseItems).forEach(key => {
        currentItems.set(key, baseItems[key]);
      });
      facility.baseItems = currentItems;
    }

    await facility.save();
    const populated = await Facility.findById(facility._id).populate('category fireStation center');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 4. Delete Facility
exports.deleteFacility = async (req, res) => {
  try {
    const { id } = req.params;
    const facility = await Facility.findByIdAndDelete(id);
    if (!facility) return res.status(404).json({ error: 'Facility not found' });
    
    await Inspection.deleteMany({ facility: id });

    res.json({ message: 'Facility and related inspections deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 5. Get Facility Inspections
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

// 6. Get Dashboard Summary
exports.getDashboardSummary = async (req, res) => {
  try {
    const { fireStation, center, category } = req.query;
    
    let activeCategory = null;
    if (category) {
      activeCategory = await Category.findById(category);
    } else {
      activeCategory = await Category.findOne(); 
    }

    if (!activeCategory) {
      return res.json({
        totalFacilities: 0,
        inspectionsCount: 0,
        recentInspections: [],
        currentQuarter: getCurrentQuarter(),
        equipmentStats: {}
      });
    }

    const facFilter = { category: activeCategory._id };
    if (fireStation) facFilter.fireStation = fireStation;
    if (center) facFilter.center = center;

    const totalFacilities = await Facility.countDocuments(facFilter);
    const targetFacilityIds = await Facility.distinct('_id', facFilter);

    const currentQuarter = getCurrentQuarter();
    const inspectedFacilities = await Inspection.distinct('facility', {
      facility: { $in: targetFacilityIds },
      quarter: currentQuarter
    });
    const inspectionsCount = inspectedFacilities.length;

    const recentInspections = await Inspection.find({
      facility: { $in: targetFacilityIds }
    })
      .populate({ path: 'facility', populate: { path: 'category' } })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const latestInspections = await Inspection.aggregate([
      { $match: { facility: { $in: targetFacilityIds } } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: "$facility", latest: { $first: "$$ROOT" } } }
    ]);

    const equipmentStats = {};
    activeCategory.inspectionFields.forEach(field => {
      equipmentStats[field.key] = { good: 0, bad: 0, none: 0 };
    });

    latestInspections.forEach(item => {
      const status = item.latest.itemsStatus || {};
      
      activeCategory.inspectionFields.forEach(field => {
        const val = status.get ? status.get(field.key) : status[field.key];
        const normalizedVal = val || (field.options && field.options[0]) || '양호';
        if (['양호', '완료', '지정'].includes(normalizedVal)) {
          equipmentStats[field.key].good++;
        } else if (['불량', '정비필요', '교체대상', '철거대상', '미완료', '미지정'].includes(normalizedVal)) {
          equipmentStats[field.key].bad++;
        } else {
          equipmentStats[field.key].none++;
        }
      });
    });

    res.json({
      totalFacilities,
      inspectionsCount,
      recentInspections,
      currentQuarter,
      equipmentStats,
      category: activeCategory
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 7. Create Inspection
exports.createInspection = async (req, res) => {
  try {
    const { facilityId } = req.params;
    const { affiliation, inspectorName, itemsStatus, notes } = req.body;
    
    const facility = await Facility.findById(facilityId).populate('category');
    if (!facility) return res.status(404).json({ error: 'Facility not found' });

    let externalPhotoPath = '';
    let internalPhotoPath = '';
    const photos = [];
    
    const processImage = async (fileBuffer, originalname) => {
      const filename = `optimized-${Date.now()}-${originalname}`;
      const outputPath = path.join(__dirname, '..', 'uploads', filename);
      await sharp(fileBuffer)
        .resize({ width: 800, withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toFile(outputPath);
      return `/uploads/${filename}`;
    };

    if (req.files) {
      if (req.files['externalPhoto']) {
        externalPhotoPath = await processImage(req.files['externalPhoto'][0].buffer, req.files['externalPhoto'][0].originalname);
        photos.push({ label: '외부 사진', path: externalPhotoPath });
      }
      if (req.files['internalPhoto']) {
        internalPhotoPath = await processImage(req.files['internalPhoto'][0].buffer, req.files['internalPhoto'][0].originalname);
        photos.push({ label: '내부 사진', path: internalPhotoPath });
      }

      if (Array.isArray(req.files)) {
        for (let i = 0; i < req.files.length; i++) {
          const file = req.files[i];
          const path = await processImage(file.buffer, file.originalname);
          const label = file.fieldname || `사진 ${i + 1}`;
          photos.push({ label, path });
          
          if (i === 0 && !externalPhotoPath) externalPhotoPath = path;
          if (i === 1 && !internalPhotoPath) internalPhotoPath = path;
        }
      }
    }

    const isRequiredPhotos = ['water_rescue', 'mountain_kit', 'mountain_sign'].includes(facility.category?.key);
    if (isRequiredPhotos && !externalPhotoPath && !internalPhotoPath && photos.length < 2) {
      return res.status(400).json({ error: `${facility.category?.name || '시설물'} 점검 시 사진 2장(외부, 내부)이 필수적입니다.` });
    }

    const currentQuarter = getCurrentQuarter();

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
      photos,
      notes
    });

    await inspection.save();
    res.status(201).json(inspection);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 8. Update Inspection
exports.updateInspection = async (req, res) => {
  try {
    const { id } = req.params;
    const { affiliation, inspectorName, itemsStatus, notes } = req.body;
    
    const inspection = await Inspection.findById(id);
    if (!inspection) return res.status(404).json({ error: 'Inspection not found' });

    let externalPhotoPath = inspection.externalPhotoPath;
    let internalPhotoPath = inspection.internalPhotoPath;
    let photos = inspection.photos || [];

    const processImage = async (fileBuffer, originalname) => {
      const filename = `optimized-${Date.now()}-${originalname}`;
      const outputPath = path.join(__dirname, '..', 'uploads', filename);
      await sharp(fileBuffer)
        .resize({ width: 800, withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toFile(outputPath);
      return `/uploads/${filename}`;
    };

    if (req.files) {
      if (req.files['externalPhoto']) {
        externalPhotoPath = await processImage(req.files['externalPhoto'][0].buffer, req.files['externalPhoto'][0].originalname);
        const idx = photos.findIndex(p => p.label === '외부 사진');
        if (idx !== -1) photos[idx].path = externalPhotoPath;
        else photos.push({ label: '외부 사진', path: externalPhotoPath });
      }
      if (req.files['internalPhoto']) {
        internalPhotoPath = await processImage(req.files['internalPhoto'][0].buffer, req.files['internalPhoto'][0].originalname);
        const idx = photos.findIndex(p => p.label === '내부 사진');
        if (idx !== -1) photos[idx].path = internalPhotoPath;
        else photos.push({ label: '내부 사진', path: internalPhotoPath });
      }

      if (Array.isArray(req.files)) {
        photos = [];
        for (let i = 0; i < req.files.length; i++) {
          const file = req.files[i];
          const path = await processImage(file.buffer, file.originalname);
          const label = file.fieldname || `사진 ${i + 1}`;
          photos.push({ label, path });
          
          if (i === 0) externalPhotoPath = path;
          if (i === 1) internalPhotoPath = path;
        }
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
    inspection.photos = photos;

    await inspection.save();
    res.json(inspection);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 9. Delete Inspection
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
  const month = date.getMonth(); 
  const quarter = Math.floor(month / 3) + 1;
  return `${year}-Q${quarter}`;
}

// 10. Get Categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find({});
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
