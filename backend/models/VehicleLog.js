const mongoose = require('mongoose');

const vehicleLogSchema = new mongoose.Schema({
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  driverName: { type: String, required: true }, // 운전자/운행자
  affiliation: { type: String, required: true }, // 소속 (예: 의령119안전센터)
  purpose: { 
    type: String, 
    required: true, 
    enum: ['화재 출동', '구조 출동', '구급 출동', '순찰', '교육 훈련', '정비 이송', '기타'] 
  }, // 운행 목적
  departureTime: { type: String, required: true }, // 출발 일시 (YYYY-MM-DD HH:mm)
  arrivalTime: { type: String, required: true }, // 도착 일시 (YYYY-MM-DD HH:mm)
  startMileage: { type: Number, required: true }, // 출발 주행거리 (km)
  endMileage: { type: Number, required: true }, // 도착 주행거리 (km)
  distance: { type: Number, required: true }, // 운행거리 (km)
  fuelRefueled: { type: Number, default: 0 }, // 주유량 (L)
  notes: { type: String, default: '' } // 비고/특이사항
}, { timestamps: true });

module.exports = mongoose.model('VehicleLog', vehicleLogSchema);
