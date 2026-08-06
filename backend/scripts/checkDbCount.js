const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const FireWater = require('../models/FireWater');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function checkCount() {
  const uri = process.env.MONGO_URI || 'mongodb://100.98.209.0:27017/safety_facilities';
  await mongoose.connect(uri);
  const count = await FireWater.countDocuments();
  console.log(`CURRENT DB COUNT AT ${uri}: ${count} records`);
  await mongoose.connection.close();
}

checkCount();
