const mongoose = require('mongoose');

const fireWaterInspectionSchema = new mongoose.Schema({
  fireWater: { type: mongoose.Schema.Types.ObjectId, ref: 'FireWater', required: true },
  affiliation: { type: String, required: true }, // 소속 (e.g. 의령119안전센터)
  inspectorName: { type: String, required: true }, // 점검자 이름
  quarter: { type: String, required: true }, // 점검 분기 (e.g. "2026-Q3")
  itemsStatus: {
    bodyStatus: { type: String, enum: ['양호', '불량', '없음'], default: '양호' }, // 소화전 몸체 및 외관 상태
    signStatus: { type: String, enum: ['양호', '불량', '없음'], default: '양호' }, // 표지판 및 보호틀 상태
    valveStatus: { type: String, enum: ['양호', '불량', '없음'], default: '양호' }, // 밸브 작동 상태
    waterStatus: { type: String, enum: ['양호', '불량', '없음'], default: '양호' }  // 수압 및 방수 상태
  },
  externalPhotoPath: { type: String, required: true }, // 외부 현경/사진
  internalPhotoPath: { type: String, required: true }, // 상세/내부 사진
  notes: { type: String } // 특이사항
}, { timestamps: true });

module.exports = mongoose.model('FireWaterInspection', fireWaterInspectionSchema);
