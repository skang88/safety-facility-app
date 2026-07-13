const mongoose = require('mongoose');

const inspectionSchema = new mongoose.Schema({
  facility: { type: mongoose.Schema.Types.ObjectId, ref: 'Facility', required: true },
  affiliation: { type: String, required: true }, // 소속
  inspectorName: { type: String, required: true }, // 이름
  quarter: { type: String, required: true }, // e.g. "2024-Q4"
  itemsStatus: {
    type: Map,
    of: String,
    default: {}
  },
  externalPhotoPath: { type: String }, // 호환성 유지
  internalPhotoPath: { type: String }, // 호환성 유지
  photos: [{
    label: { type: String },
    path: { type: String }
  }],
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Inspection', inspectionSchema);
