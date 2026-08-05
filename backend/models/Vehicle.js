const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  vehicleNumber: { type: String, required: true, unique: true }, // 차량번호 (예: 경남70바 1234, 의령 펌프1호)
  name: { type: String, required: true }, // 차량 명칭 (예: 의령 1호 펌프차)
  type: { 
    type: String, 
    required: true, 
    enum: ['펌프차', '물탱크차', '사다리차', '구급차', '지휘차', '구조차', '행정차'] 
  }, // 차량 종류
  region: { 
    type: String, 
    required: true, 
    enum: ['의령', '부림', '정곡'] 
  }, // 관서/센터
  status: { 
    type: String, 
    default: '운용중', 
    enum: ['운용중', '점검중', '정비중', '휴차'] 
  }, // 차량 상태
  manufactureYear: { type: String, default: '' }, // 연식/도입연도 (예: 2021)
  totalMileage: { type: Number, default: 0 }, // 누적 주행거리 (km)
  nextInspectionDate: { type: String, default: '' }, // 차기 정기점검 예정일 (YYYY-MM-DD)
  nextMaintenanceDate: { type: String, default: '' }, // 차기 소모품/정비 예정일 (YYYY-MM-DD)
  fuelType: { type: String, default: '경유', enum: ['경유', '휘발유', '전기', '하이브리드'] },
  details: { type: String, default: '' } // 기타 특이사항/비고
}, { timestamps: true });

module.exports = mongoose.model('Vehicle', vehicleSchema);
