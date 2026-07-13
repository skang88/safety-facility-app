const mongoose = require('mongoose');

const fireWaterSchema = new mongoose.Schema({
  serialNumber: { type: String }, // 일련번호/관리번호
  name: { type: String, required: true }, // 용수명
  type: { 
    type: String, 
    required: true, 
    enum: ['지상소화전', '지하소화전', '급수탑', '저수조', '비상소화장치'] 
  }, // 구분
  region: { 
    type: String, 
    required: true, 
    enum: ['의령', '부림', '정곡'] 
  }, // 관서 (안전센터)
  address: { type: String, required: true }, // 위치(주소)
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  diameter: { type: String, default: '' }, // 구경 (mm)
  installDate: { type: String, default: '' }, // 설치일자
  details: { type: String, default: '' } // 기타상세/비고
}, { timestamps: true });

fireWaterSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('FireWater', fireWaterSchema);
