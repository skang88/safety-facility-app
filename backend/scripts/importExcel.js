const mongoose = require('mongoose');
const xlsx = require('xlsx');
const path = require('path');
const dotenv = require('dotenv');
const Facility = require('../models/Facility');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/safety_facilities';
const EXCEL_FILE_PATH = path.join(__dirname, '../(의령)4분기 수난인명구조장비함 점검결과.xlsx');

async function importData() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Read Excel File
    const workbook = xlsx.readFile(EXCEL_FILE_PATH);
    const sheet = workbook.Sheets['대장'];
    const data = xlsx.utils.sheet_to_json(sheet, {header: 1});

    let importCount = 0;

    // Start from row index 4 (5th row) where data actually starts
    for (let i = 4; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length < 12) continue;

      const regionData = row[1]; // 관서
      
      // Only import '의령' as requested
      if (regionData && String(regionData).includes('의령')) {
        const name = row[3] || `의령 시설물 - ${importCount + 1}`; // 관리번호
        const department = row[2] || ''; // 관리부서
        const locationDesc = row[7] || ''; // 위치
        
        let regionEnum = '의령'; // Default
        if (department.includes('부림')) regionEnum = '부림';
        else if (department.includes('정곡')) regionEnum = '정곡';
        else if (department.includes('의령')) regionEnum = '의령';

        let longitude = parseFloat(row[10]); // 경도
        let latitude = parseFloat(row[11]); // 위도

        if (isNaN(longitude) || isNaN(latitude)) {
           // Skip if invalid lat/lon
           continue;
        }

        const facility = new Facility({
          name: name + (locationDesc ? ` (${locationDesc})` : ''),
          region: regionEnum,
          location: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          baseItems: {
            lifebuoy: 1,
            lifeJacket: 1,
            lifeline: 1,
            throwBag: 1
          }
        });

        await facility.save();
        importCount++;
      }
    }

    console.log(`Successfully imported ${importCount} facilities for '의령'`);
    process.exit(0);
  } catch (error) {
    console.error('Error importing data:', error);
    process.exit(1);
  }
}

importData();
