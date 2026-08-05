const fs = require('fs');
const path = require('path');
const DrowningRisk = require('../models/DrowningRisk');

async function seedDrowningRiskData() {
  try {
    const count = await DrowningRisk.countDocuments();
    if (count > 0) {
      console.log(`[DrowningRisk] Already seeded (${count} records in DB). Skipping.`);
      return;
    }

    // 1. Primary: Load from Git-tracked JSON seed file
    const jsonPath = path.join(__dirname, '..', 'seedData', 'drowningRiskGyeongnam.json');
    if (fs.existsSync(jsonPath)) {
      console.log('[DrowningRisk] Seeding Gyeongnam risk points from seedData JSON...');
      const rawData = fs.readFileSync(jsonPath, 'utf8');
      const records = JSON.parse(rawData);
      if (records && records.length > 0) {
        await DrowningRisk.insertMany(records);
        console.log(`[DrowningRisk] Successfully seeded ${records.length} Gyeongnam risk records from JSON!`);
        return;
      }
    }

    // 2. Fallback: Parse CSV file if present
    const csvPath = path.join(__dirname, '..', '..', 'data', '밀집도_data.csv');
    if (fs.existsSync(csvPath)) {
      console.log('[DrowningRisk] Reading Gyeongnam accident data from CSV...');
      const content = fs.readFileSync(csvPath, 'utf8');
      const lines = content.split(/\r?\n/);
      const records = [];

      lines.forEach((line, idx) => {
        if (idx === 0 || !line.trim()) return;
        const parts = line.split(',');
        if (parts.length >= 5) {
          const lat = parseFloat(parts[0]);
          const lng = parseFloat(parts[1]);
          const causeSub = parts[2]?.trim() || '기타';
          const causeMain = parts[3]?.trim() || '익수';
          const address = parts[4]?.trim() || '';
          const weatherWarning = parts[5]?.trim() || '';

          if (address.includes('경상남도') || address.includes('경남')) {
            if (!isNaN(lat) && !isNaN(lng) && lat > 0 && lng > 0) {
              records.push({
                lat,
                lng,
                causeSub,
                causeMain,
                address,
                weatherWarning,
                region: '경상남도'
              });
            }
          }
        }
      });

      if (records.length > 0) {
        await DrowningRisk.insertMany(records);
        console.log(`[DrowningRisk] Successfully seeded ${records.length} Gyeongnam accident risk records from CSV!`);
      }
    } else {
      console.warn('[DrowningRisk] Neither JSON seed nor CSV file was found.');
    }
  } catch (error) {
    console.error('[DrowningRisk] Error seeding drowning risk data:', error);
  }
}

module.exports = seedDrowningRiskData;
