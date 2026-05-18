const mongoose = require('mongoose');

const inspectionSchema = new mongoose.Schema({
  facility: { type: mongoose.Schema.Types.ObjectId, ref: 'Facility', required: true },
  affiliation: { type: String, required: true }, // 소속
  inspectorName: { type: String, required: true }, // 이름
  quarter: { type: String, required: true }, // e.g. "2024-Q4"
  itemsStatus: {
    lifebuoy: { type: String, enum: ['양호', '불량', '없음'], default: '양호' },
    lifeJacket: { type: String, enum: ['양호', '불량', '없음'], default: '양호' },
    lifeline: { type: String, enum: ['양호', '불량', '없음'], default: '양호' },
    throwBag: { type: String, enum: ['양호', '불량', '없음'], default: '양호' }
  },
  externalPhotoPath: { type: String, required: true }, // 외부 사진
  internalPhotoPath: { type: String, required: true }, // 내부 사진
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Inspection', inspectionSchema);
