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

    const csvPath = path.join(__dirname, '..', '..', 'data', '밀집도_data.csv');
    if (!fs.existsSync(csvPath)) {
      console.warn('[DrowningRisk] CSV file not found at:', csvPath);
      return;
    }

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

        // Filter for Gyeongnam province only as requested
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
      console.log(`[DrowningRisk] Successfully seeded ${records.length} Gyeongnam accident risk records!`);
    } else {
      console.warn('[DrowningRisk] No Gyeongnam records matched from CSV.');
    }
  } catch (error) {
    console.error('[DrowningRisk] Error seeding drowning risk data:', error);
  }
}

module.exports = seedDrowningRiskData;
