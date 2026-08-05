const mongoose = require('mongoose');

const drowningRiskSchema = new mongoose.Schema({
  lat: { type: Number, required: true }, // 위도
  lng: { type: Number, required: true }, // 경도
  causeSub: { type: String, default: '기타' }, // 사고원인 소분류 (물놀이, 실족, 낚시, 어패류채취 등)
  causeMain: { type: String, default: '익수' }, // 사고원인 중분류
  address: { type: String, required: true }, // 출동지 주소
  weatherWarning: { type: String, default: '' }, // 특보 종류 (호우, 태풍 등)
  region: { type: String, default: '경상남도' }
}, { timestamps: true });

// Add spatial 2dsphere index for fast geographical queries if needed
drowningRiskSchema.index({ lat: 1, lng: 1 });

module.exports = mongoose.model('DrowningRisk', drowningRiskSchema);
