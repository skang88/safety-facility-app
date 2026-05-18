const mongoose = require('mongoose');

const facilitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  region: { type: String, required: true, enum: ['의령', '부림', '정곡'] },
  location: {
    type: {
      type: String, // Don't do `{ location: { type: String } }`
      enum: ['Point'], // 'location.type' must be 'Point'
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  baseItems: {
    lifebuoy: { type: Number, default: 0 },   // 구명환
    lifeJacket: { type: Number, default: 0 }, // 구명쪼끼
    lifeline: { type: Number, default: 0 },   // 구명줄
    throwBag: { type: Number, default: 0 }    // 드로우백
  }
}, { timestamps: true });

facilitySchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Facility', facilitySchema);
