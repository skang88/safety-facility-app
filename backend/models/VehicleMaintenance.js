const mongoose = require('mongoose');

const vehicleMaintenanceSchema = new mongoose.Schema({
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  inspectorName: { type: String, required: true }, // 점검/정비자 이름
  affiliation: { type: String, required: true }, // 소속
  maintenanceType: { 
    type: String, 
    required: true, 
    enum: ['정기점검', '수시점검', '소모품교환', '고장수리'] 
  }, // 점검/정비 종류
  inspectionDate: { type: String, required: true }, // 점검/정비일자 (YYYY-MM-DD)
  nextDueDate: { type: String, default: '' }, // 차기 점검/정비 예정일 (YYYY-MM-DD)
  itemsChecked: {
    engineOil: { type: String, enum: ['양호', '교환필요', '해당없음'], default: '양호' }, // 엔진오일
    brakeStatus: { type: String, enum: ['양호', '정비필요', '해당없음'], default: '양호' }, // 브레이크/제동장치
    tireStatus: { type: String, enum: ['양호', '교환필요', '해당없음'], default: '양호' }, // 타이어
    pumpStatus: { type: String, enum: ['양호', '불량', '해당없음'], default: '양호' }, // 소방펌프/특장
    batteryStatus: { type: String, enum: ['양호', '교환필요', '해당없음'], default: '양호' } // 배터리
  },
  cost: { type: Number, default: 0 }, // 정비비용 (원)
  photoPath: { type: String, default: '' }, // 증빙/정비 사진
  notes: { type: String, default: '' } // 정비 세부내역 및 특이사항
}, { timestamps: true });

module.exports = mongoose.model('VehicleMaintenance', vehicleMaintenanceSchema);
