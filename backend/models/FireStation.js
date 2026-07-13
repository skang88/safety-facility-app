const mongoose = require('mongoose');

const fireStationSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // 예: "의령소방서"
}, { timestamps: true });

module.exports = mongoose.model('FireStation', fireStationSchema);
