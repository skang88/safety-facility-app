const mongoose = require('mongoose');

const centerSchema = new mongoose.Schema({
  fireStation: { type: mongoose.Schema.Types.ObjectId, ref: 'FireStation', required: true },
  name: { type: String, required: true }, // 예: "의령119안전센터", "부림119안전센터"
}, { timestamps: true });

centerSchema.index({ fireStation: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Center', centerSchema);
