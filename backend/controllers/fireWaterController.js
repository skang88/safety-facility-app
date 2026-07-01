const FireWater = require('../models/FireWater');
const FireWaterInspection = require('../models/FireWaterInspection');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');

// Helper to get current quarter
function getCurrentQuarter() {
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-11
  const quarter = Math.floor(month / 3) + 1;
  return `${year}-Q${quarter}`;
}

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
      const processImage = async (fileBuffer, originalname) => {
        const filename = `optimized-fw-${Date.now()}-${originalname}`;
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
      const processImage = async (fileBuffer, originalname) => {
        const filename = `optimized-fw-${Date.now()}-${originalname}`;
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

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    if (rows.length === 0) {
      return res.status(400).json({ error: 'The Excel file is empty' });
    }

    let headerRowIndex = -1;
    let colIndices = {
      serialNumber: -1,
      name: -1,
      type: -1,
      region: -1,
      address: -1,
      longitude: -1,
      latitude: -1,
      diameter: -1,
      installDate: -1,
      details: -1
    };

    // Find header row in first 15 rows
    for (let r = 0; r < Math.min(rows.length, 15); r++) {
      const row = rows[r];
      if (!row) continue;
      
      let matchCount = 0;
      for (let c = 0; c < row.length; c++) {
        const val = String(row[c] || '').trim().toLowerCase();
        if (val.includes('주소') || val.includes('위치') || val.includes('경도') || val.includes('위도') || val.includes('명칭') || val.includes('용수명') || val.includes('구분') || val.includes('시설명')) {
          matchCount++;
        }
      }
      
      if (matchCount >= 2) {
        headerRowIndex = r;
        for (let c = 0; c < row.length; c++) {
          const val = String(row[c] || '').trim().toLowerCase();
          if (val.includes('번호') || val.includes('연번') || val.includes('id')) colIndices.serialNumber = c;
          else if (val.includes('용수명') || val.includes('명칭') || val.includes('시설명') || val.includes('이름')) colIndices.name = c;
          else if (val.includes('구분') || val.includes('종류') || val.includes('분류')) colIndices.type = c;
          else if (val.includes('관서') || val.includes('센터') || val.includes('안전센터') || val.includes('부서')) colIndices.region = c;
          else if (val.includes('주소') || val.includes('위치') || val.includes('소재지')) colIndices.address = c;
          else if (val.includes('경도') || val === 'x') colIndices.longitude = c;
          else if (val.includes('위도') || val === 'y') colIndices.latitude = c;
          else if (val.includes('구경')) colIndices.diameter = c;
          else if (val.includes('설치') || val.includes('일자') || val.includes('일시')) colIndices.installDate = c;
          else if (val.includes('비고') || val.includes('상세') || val.includes('기타')) colIndices.details = c;
        }
        break;
      }
    }

    // Default column mapping if no clear headers found
    if (headerRowIndex === -1 && rows.length > 0) {
      headerRowIndex = 0;
      const firstRow = rows[0];
      for (let c = 0; c < firstRow.length; c++) {
        const val = String(firstRow[c] || '').trim().toLowerCase();
        if (val.includes('번호') || val.includes('연번')) colIndices.serialNumber = c;
        else if (val.includes('용수명') || val.includes('명칭') || val.includes('시설명') || val.includes('이름')) colIndices.name = c;
        else if (val.includes('구분') || val.includes('종류')) colIndices.type = c;
        else if (val.includes('관서') || val.includes('센터') || val.includes('부서')) colIndices.region = c;
        else if (val.includes('주소') || val.includes('위치') || val.includes('소재지')) colIndices.address = c;
        else if (val.includes('경도') || val === 'x') colIndices.longitude = c;
        else if (val.includes('위도') || val === 'y') colIndices.latitude = c;
        else if (val.includes('구경')) colIndices.diameter = c;
        else if (val.includes('설치') || val.includes('일자')) colIndices.installDate = c;
        else if (val.includes('비고') || val.includes('상세')) colIndices.details = c;
      }
    }

    let importCount = 0;
    for (let i = headerRowIndex + 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;
      
      const nameVal = colIndices.name !== -1 ? String(row[colIndices.name] || '').trim() : '';
      if (!nameVal) continue; // Skip if no name
      
      const serialVal = colIndices.serialNumber !== -1 ? String(row[colIndices.serialNumber] || '').trim() : '';
      const typeRaw = colIndices.type !== -1 ? String(row[colIndices.type] || '').trim() : '';
      let typeVal = '지상소화전';
      if (typeRaw.includes('지하')) typeVal = '지하소화전';
      else if (typeRaw.includes('지상')) typeVal = '지상소화전';
      else if (typeRaw.includes('급수')) typeVal = '급수탑';
      else if (typeRaw.includes('저수')) typeVal = '저수조';
      else if (typeRaw.includes('비상')) typeVal = '비상소화장치';

      const regionRaw = colIndices.region !== -1 ? String(row[colIndices.region] || '').trim() : '';
      let regionVal = '의령';
      if (regionRaw.includes('부림')) regionVal = '부림';
      else if (regionRaw.includes('정곡')) regionVal = '정곡';
      
      const addressVal = colIndices.address !== -1 ? String(row[colIndices.address] || '').trim() : nameVal;
      
      let lonVal = colIndices.longitude !== -1 ? parseFloat(row[colIndices.longitude]) : 0;
      let latVal = colIndices.latitude !== -1 ? parseFloat(row[colIndices.latitude]) : 0;
      
      if (isNaN(lonVal) || isNaN(latVal) || lonVal === 0 || latVal === 0) {
        lonVal = 128.2570;
        latVal = 35.3168;
      }
      
      const diameterVal = colIndices.diameter !== -1 ? String(row[colIndices.diameter] || '').trim() : '';
      const installDateVal = colIndices.installDate !== -1 ? String(row[colIndices.installDate] || '').trim() : '';
      const detailsVal = colIndices.details !== -1 ? String(row[colIndices.details] || '').trim() : '';

      // Find by name and region
      let fireWater = await FireWater.findOne({ name: nameVal, region: regionVal });
      if (!fireWater) {
        fireWater = new FireWater({
          serialNumber: serialVal,
          name: nameVal,
          type: typeVal,
          region: regionVal,
          address: addressVal,
          location: {
            type: 'Point',
            coordinates: [lonVal, latVal]
          },
          diameter: diameterVal,
          installDate: installDateVal,
          details: detailsVal
        });
      } else {
        fireWater.serialNumber = serialVal || fireWater.serialNumber;
        fireWater.type = typeVal;
        fireWater.address = addressVal;
        fireWater.location = {
          type: 'Point',
          coordinates: [lonVal, latVal]
        };
        fireWater.diameter = diameterVal || fireWater.diameter;
        fireWater.installDate = installDateVal || fireWater.installDate;
        fireWater.details = detailsVal || fireWater.details;
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
    
    const excelRows = list.map(item => ({
      '일련번호/관리번호': item.serialNumber || '',
      '소방용수구분': item.type,
      '용수명/명칭': item.name,
      '관서/안전센터': item.region + '119안전센터',
      '소재지/주소': item.address,
      '경도(X)': item.location.coordinates[0],
      '위도(Y)': item.location.coordinates[1],
      '구경(mm)': item.diameter || '',
      '설치일자': item.installDate || '',
      '기타상세/비고': item.details || ''
    }));

    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(excelRows);
    xlsx.utils.book_append_sheet(wb, ws, "소방용수 대상물 목록");
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

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

    const excelRows = list.map(item => {
      const latestInspection = inspectionMap[item._id.toString()] || null;
      const isInspected = latestInspection ? latestInspection.quarter === currentQuarter : false;
      const insp = isInspected ? latestInspection : null;

      return {
        '일련번호/관리번호': item.serialNumber || '',
        '소방용수구분': item.type,
        '용수명/명칭': item.name,
        '관서/안전센터': item.region + '119안전센터',
        '소재지/주소': item.address,
        '경도(X)': item.location.coordinates[0],
        '위도(Y)': item.location.coordinates[1],
        '구경(mm)': item.diameter || '',
        '설치일자': item.installDate || '',
        '점검여부': isInspected ? '점검완료' : '미점검',
        '점검일시': insp ? new Date(insp.createdAt).toLocaleDateString() : '',
        '점검자': insp ? `${insp.affiliation} ${insp.inspectorName}` : '',
        '몸체외관상태': insp ? insp.itemsStatus.bodyStatus : '',
        '표지판상태': insp ? insp.itemsStatus.signStatus : '',
        '밸브작동상태': insp ? insp.itemsStatus.valveStatus : '',
        '수압방수상태': insp ? insp.itemsStatus.waterStatus : '',
        '특이사항': insp ? insp.notes || '특이사항 없음' : ''
      };
    });

    // Sort by region, then inspection status, then name
    excelRows.sort((a, b) => {
      if (a['관서/안전센터'] !== b['관서/안전센터']) {
        return a['관서/안전센터'].localeCompare(b['관서/안전센터']);
      }
      if (a['점검여부'] !== b['점검여부']) {
        return b['점검여부'].localeCompare(a['점검여부']); // '완료' first
      }
      return a['용수명/명칭'].localeCompare(b['용수명/명칭'], 'ko', { numeric: true });
    });

    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(excelRows);
    xlsx.utils.book_append_sheet(wb, ws, "소방용수 점검 결과");
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

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
