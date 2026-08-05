const Vehicle = require('../models/Vehicle');
const VehicleLog = require('../models/VehicleLog');
const VehicleMaintenance = require('../models/VehicleMaintenance');
const xlsx = require('xlsx');
const sharp = require('sharp');
const path = require('path');

// Helper to calculate D-Day between today and a date string (YYYY-MM-DD)
function calculateDDay(dateString) {
  if (!dateString) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateString);
  if (isNaN(target.getTime())) return null;
  target.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// Get all vehicles with D-Day alerts
exports.getVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find().lean();
    
    const enriched = vehicles.map(v => {
      const inspDDay = calculateDDay(v.nextInspectionDate);
      const maintDDay = calculateDDay(v.nextMaintenanceDate);
      
      // Determine overall alert priority (0: Urgent Overdue, 1: Due within 7 days, 2: Due within 14 days, 3: Normal)
      let alertLevel = 'normal';
      let alertMessage = '';
      
      if (inspDDay !== null && inspDDay < 0) {
        alertLevel = 'overdue';
        alertMessage = `정기점검 ${Math.abs(inspDDay)}일 지연!`;
      } else if (maintDDay !== null && maintDDay < 0) {
        alertLevel = 'overdue';
        alertMessage = `정비/소모품교환 ${Math.abs(maintDDay)}일 지연!`;
      } else if (inspDDay !== null && inspDDay <= 7) {
        alertLevel = 'warning';
        alertMessage = `정기점검 D-${inspDDay}`;
      } else if (maintDDay !== null && maintDDay <= 7) {
        alertLevel = 'warning';
        alertMessage = `정비예정 D-${maintDDay}`;
      } else if (inspDDay !== null && inspDDay <= 14) {
        alertLevel = 'notice';
        alertMessage = `정기점검 D-${inspDDay}`;
      }

      return {
        ...v,
        inspDDay,
        maintDDay,
        alertLevel,
        alertMessage
      };
    });

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create a new vehicle
exports.createVehicle = async (req, res) => {
  try {
    const { vehicleNumber, name, type, region, status, manufactureYear, totalMileage, nextInspectionDate, nextMaintenanceDate, fuelType, details } = req.body;

    const existing = await Vehicle.findOne({ vehicleNumber });
    if (existing) {
      return res.status(400).json({ error: '이미 등록된 차량번호입니다.' });
    }

    const vehicle = new Vehicle({
      vehicleNumber,
      name,
      type,
      region,
      status: status || '운용중',
      manufactureYear: manufactureYear || '',
      totalMileage: totalMileage ? Number(totalMileage) : 0,
      nextInspectionDate: nextInspectionDate || '',
      nextMaintenanceDate: nextMaintenanceDate || '',
      fuelType: fuelType || '경유',
      details: details || ''
    });

    await vehicle.save();
    res.status(201).json(vehicle);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update vehicle
exports.updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const vehicle = await Vehicle.findByIdAndUpdate(id, updateData, { new: true });
    if (!vehicle) return res.status(404).json({ error: '차량을 찾을 수 없습니다.' });

    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete vehicle
exports.deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const vehicle = await Vehicle.findByIdAndDelete(id);
    if (!vehicle) return res.status(404).json({ error: '차량을 찾을 수 없습니다.' });

    await VehicleLog.deleteMany({ vehicle: id });
    await VehicleMaintenance.deleteMany({ vehicle: id });

    res.json({ message: '차량 및 관련 운행/정비 기록이 삭제되었습니다.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get operation driving logs
exports.getVehicleLogs = async (req, res) => {
  try {
    const { vehicleId } = req.query;
    const filter = vehicleId ? { vehicle: vehicleId } : {};

    const logs = await VehicleLog.find(filter)
      .populate('vehicle')
      .sort({ createdAt: -1 })
      .lean();

    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create operation driving log
exports.createVehicleLog = async (req, res) => {
  try {
    const { vehicleId, driverName, affiliation, purpose, departureTime, arrivalTime, startMileage, endMileage, fuelRefueled, notes } = req.body;

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) return res.status(404).json({ error: '차량을 찾을 수 없습니다.' });

    const sMileage = Number(startMileage);
    const eMileage = Number(endMileage);
    const distance = Math.max(0, eMileage - sMileage);

    const log = new VehicleLog({
      vehicle: vehicleId,
      driverName,
      affiliation,
      purpose,
      departureTime,
      arrivalTime,
      startMileage: sMileage,
      endMileage: eMileage,
      distance,
      fuelRefueled: fuelRefueled ? Number(fuelRefueled) : 0,
      notes: notes || ''
    });

    await log.save();

    // Automatically update vehicle's total mileage if endMileage is higher
    if (eMileage > vehicle.totalMileage) {
      vehicle.totalMileage = eMileage;
      await vehicle.save();
    }

    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get maintenance records
exports.getVehicleMaintenances = async (req, res) => {
  try {
    const { vehicleId } = req.query;
    const filter = vehicleId ? { vehicle: vehicleId } : {};

    const maintenances = await VehicleMaintenance.find(filter)
      .populate('vehicle')
      .sort({ createdAt: -1 })
      .lean();

    res.json(maintenances);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create maintenance record
exports.createVehicleMaintenance = async (req, res) => {
  try {
    const { vehicleId, inspectorName, affiliation, maintenanceType, inspectionDate, nextDueDate, itemsChecked, cost, notes } = req.body;

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) return res.status(404).json({ error: '차량을 찾을 수 없습니다.' });

    let photoPath = '';
    if (req.file) {
      const filename = `vehicle-maint-${Date.now()}-${req.file.originalname}`;
      const outputPath = path.join(__dirname, '..', 'uploads', filename);
      await sharp(req.file.buffer)
        .resize({ width: 800, withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toFile(outputPath);
      photoPath = `/uploads/${filename}`;
    }

    let parsedItems = {};
    try {
      parsedItems = typeof itemsChecked === 'string' ? JSON.parse(itemsChecked) : itemsChecked;
    } catch (e) {
      parsedItems = {};
    }

    const maintenance = new VehicleMaintenance({
      vehicle: vehicleId,
      inspectorName,
      affiliation,
      maintenanceType,
      inspectionDate,
      nextDueDate: nextDueDate || '',
      itemsChecked: parsedItems,
      cost: cost ? Number(cost) : 0,
      photoPath,
      notes: notes || ''
    });

    await maintenance.save();

    // Update vehicle's next inspection/maintenance date if specified
    if (nextDueDate) {
      if (maintenanceType === '정기점검' || maintenanceType === '수시점검') {
        vehicle.nextInspectionDate = nextDueDate;
      } else {
        vehicle.nextMaintenanceDate = nextDueDate;
      }
      await vehicle.save();
    }

    res.status(201).json(maintenance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Dashboard summary for Fire Vehicles
exports.getVehicleDashboardSummary = async (req, res) => {
  try {
    const totalVehicles = await Vehicle.countDocuments();
    const activeVehicles = await Vehicle.countDocuments({ status: '운용중' });
    const inRepairVehicles = await Vehicle.countDocuments({ status: { $in: ['점검중', '정비중'] } });

    const vehicles = await Vehicle.find().lean();
    let alertCount = 0;

    vehicles.forEach(v => {
      const inspD = calculateDDay(v.nextInspectionDate);
      const maintD = calculateDDay(v.nextMaintenanceDate);
      if ((inspD !== null && inspD <= 7) || (maintD !== null && maintD <= 7)) {
        alertCount++;
      }
    });

    const recentLogs = await VehicleLog.find()
      .populate('vehicle')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const recentMaintenances = await VehicleMaintenance.find()
      .populate('vehicle')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    res.json({
      totalVehicles,
      activeVehicles,
      inRepairVehicles,
      alertCount,
      recentLogs,
      recentMaintenances
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Excel upload for vehicles
exports.uploadVehicleExcel = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: '엑셀 파일이 업로드되지 않았습니다.' });

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    if (rows.length === 0) return res.status(400).json({ error: '엑셀 데이터가 비어있습니다.' });

    let importedCount = 0;

    // Detect header row
    let headerRowIndex = 0;
    for (let r = 0; r < Math.min(rows.length, 10); r++) {
      const rowStr = JSON.stringify(rows[r] || []);
      if (rowStr.includes('차량번호') || rowStr.includes('차량명') || rowStr.includes('관서')) {
        headerRowIndex = r;
        break;
      }
    }

    const headers = rows[headerRowIndex].map(h => String(h || '').trim());

    for (let i = headerRowIndex + 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      let vehicleNumber = '';
      let name = '';
      let type = '펌프차';
      let region = '의령';
      let status = '운용중';
      let manufactureYear = '';
      let totalMileage = 0;
      let nextInspectionDate = '';
      let nextMaintenanceDate = '';

      headers.forEach((h, idx) => {
        const val = String(row[idx] || '').trim();
        if (h.includes('차량번호') || h.includes('번호')) vehicleNumber = val;
        else if (h.includes('차량명') || h.includes('명칭')) name = val;
        else if (h.includes('종류') || h.includes('구분') || h.includes('유형')) type = val;
        else if (h.includes('관서') || h.includes('센터')) region = val.includes('부림') ? '부림' : val.includes('정곡') ? '정곡' : '의령';
        else if (h.includes('상태')) status = val;
        else if (h.includes('연식') || h.includes('도입')) manufactureYear = val;
        else if (h.includes('주행거리') || h.includes('누적')) totalMileage = Number(val) || 0;
        else if (h.includes('점검예정') || h.includes('점검일')) nextInspectionDate = val;
        else if (h.includes('정비예정') || h.includes('소모품')) nextMaintenanceDate = val;
      });

      if (!vehicleNumber || !name) continue;

      let vehicle = await Vehicle.findOne({ vehicleNumber });
      if (!vehicle) {
        vehicle = new Vehicle({
          vehicleNumber,
          name,
          type: ['펌프차', '물탱크차', '사다리차', '구급차', '지휘차', '구조차', '행정차'].includes(type) ? type : '펌프차',
          region,
          status: ['운용중', '점검중', '정비중', '휴차'].includes(status) ? status : '운용중',
          manufactureYear,
          totalMileage,
          nextInspectionDate,
          nextMaintenanceDate
        });
      } else {
        vehicle.name = name;
        vehicle.type = type;
        vehicle.region = region;
        vehicle.status = status;
        vehicle.manufactureYear = manufactureYear;
        if (totalMileage > 0) vehicle.totalMileage = totalMileage;
        if (nextInspectionDate) vehicle.nextInspectionDate = nextInspectionDate;
        if (nextMaintenanceDate) vehicle.nextMaintenanceDate = nextMaintenanceDate;
      }

      await vehicle.save();
      importedCount++;
    }

    res.json({ message: `성공적으로 ${importedCount}대의 소방차량 데이터를 등록/업데이트했습니다.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Download vehicle list as Excel
exports.downloadVehicleExcel = async (req, res) => {
  try {
    const list = await Vehicle.find().sort({ region: 1, name: 1 }).lean();

    const data = list.map(v => ({
      '차량번호': v.vehicleNumber,
      '차량명': v.name,
      '종류': v.type,
      '관서': v.region + '119안전센터',
      '현재상태': v.status,
      '연식': v.manufactureYear,
      '누적주행거리(km)': v.totalMileage,
      '차기정기점검일': v.nextInspectionDate,
      '차기정비예정일': v.nextMaintenanceDate,
      '연료': v.fuelType,
      '비고': v.details
    }));

    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(data);
    xlsx.utils.book_append_sheet(wb, ws, "소방차량 대장");
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=' + encodeURIComponent('소방차량_관리대장.xlsx'));
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Download vehicle driving logs as Excel
exports.downloadVehicleLogsExcel = async (req, res) => {
  try {
    const logs = await VehicleLog.find()
      .populate('vehicle')
      .sort({ createdAt: -1 })
      .lean();

    const data = logs.map(l => ({
      '차량번호': l.vehicle?.vehicleNumber || '-',
      '차량명': l.vehicle?.name || '-',
      '운전자': l.driverName,
      '소속': l.affiliation,
      '운행목적': l.purpose,
      '출발일시': l.departureTime,
      '도착일시': l.arrivalTime,
      '출발주행거리(km)': l.startMileage,
      '도착주행거리(km)': l.endMileage,
      '운행거리(km)': l.distance,
      '주유량(L)': l.fuelRefueled,
      '특이사항': l.notes
    }));

    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(data);
    xlsx.utils.book_append_sheet(wb, ws, "운행기록일지");
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=' + encodeURIComponent('소방차량_운행기록일지.xlsx'));
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
