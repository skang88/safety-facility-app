const mongoose = require('mongoose');

const VolunteerSlotSchema = new mongoose.Schema({
  slotIndex: {
    type: Number,
    required: true,
    min: 0
  },
  department: {
    type: String,
    trim: true,
    default: ''
  },
  rank: {
    type: String,
    trim: true,
    default: ''
  },
  name: {
    type: String,
    trim: true,
    default: ''
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  note: {
    type: String,
    trim: true,
    default: ''
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const GeojeTransportSchema = new mongoose.Schema({
  date: {
    type: String, // Format: YYYY-MM-DD
    required: true,
    unique: true,
    index: true
  },
  departureTeamDepartment: {
    type: String,
    default: '현장대응단'
  },
  departureTeam: [VolunteerSlotSchema],
  returnTeamDepartment: {
    type: String,
    default: '소방행정과'
  },
  returnTeam: [VolunteerSlotSchema],
  generalNotes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('GeojeTransport', GeojeTransportSchema);
