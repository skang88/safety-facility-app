const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // 예: "수난인명구조장비함"
  key: { type: String, required: true, unique: true }, // 예: "water_rescue"
  icon: { type: String, default: 'LifeBuoy' }, // 프론트엔드 lucide 아이콘 매핑용
  baseItemFields: [{
    key: { type: String, required: true }, // 예: "lifebuoy"
    label: { type: String, required: true }, // 예: "구명환"
    type: { type: String, enum: ['number', 'string'], default: 'number' }
  }],
  inspectionFields: [{
    key: { type: String, required: true }, // 예: "lifebuoy"
    label: { type: String, required: true }, // 예: "구명환"
    type: { type: String, enum: ['select', 'text'], default: 'select' },
    options: [{ type: String }] // 예: ["양호", "불량", "없음"]
  }],
  photoLabels: [{ type: String }] // 예: ["외부 사진", "내부 사진"]
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
