const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const Facility = require('../models/Facility');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/safety_facilities';

async function dumpData() {
  try {
    await mongoose.connect(MONGO_URI);
    const facilities = await Facility.find({}, { _id: 0, createdAt: 0, updatedAt: 0, __v: 0 }).lean();
    fs.writeFileSync(path.join(__dirname, '../seedData.json'), JSON.stringify(facilities, null, 2));
    console.log(`Dumped ${facilities.length} facilities to seedData.json`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

dumpData();
