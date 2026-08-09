const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config();

// Models
const FireWater = require('../models/FireWater');

const refHtmlPath = path.join(__dirname, '../../reference/소방용수_통합관리_기능검수_단일웹_v5.4.4.html');

async function seedFireWaterData() {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/safety_facilities';
    console.log(`Connecting to MongoDB at: ${mongoURI}`);
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected successfully.');

    let masterItems = [];
    if (fs.existsSync(refHtmlPath)) {
      const htmlContent = fs.readFileSync(refHtmlPath, 'utf8');
      const match = htmlContent.match(/window\.FIREWATER_DATA\s*=\s*(\{[\s\S]*?\});/);

      if (!match) {
        console.error('Failed to find window.FIREWATER_DATA in HTML file.');
        process.exit(1);
      }

      const rawData = JSON.parse(match[1]);
      masterItems = rawData.master || [];
      console.log(`Extracted ${masterItems.length} records from HTML reference.`);
    } else {
      const backupJsonPath = path.join(__dirname, '../seedData/fireWaterGyeongnam.json');
      if (fs.existsSync(backupJsonPath)) {
        console.log(`HTML reference file not found. Falling back to JSON seed: ${backupJsonPath}`);
        const rawJson = fs.readFileSync(backupJsonPath, 'utf8');
        const parsed = JSON.parse(rawJson);
        masterItems = Array.isArray(parsed) ? parsed : (parsed.master || []);
        console.log(`Loaded ${masterItems.length} records from JSON seed.`);
      } else {
        console.error(`Neither HTML reference nor JSON seed data found.`);
        process.exit(1);
      }
    }

    // Clear existing FireWater data
    await FireWater.deleteMany({});
    console.log('Cleared existing FireWater collection.');

    const docsToInsert = masterItems.map(item => {
      let lng = parseFloat(item["경도"] || item["X좌표"] || "128.2570");
      let lat = parseFloat(item["위도"] || item["Y좌표"] || "35.3168");
      
      if (isNaN(lng) || lng === 0) lng = 128.2570;
      if (isNaN(lat) || lat === 0) lat = 35.3168;

      // Auto-correct inverted lat/lng coordinates if present in source data
      if (lng < 45 && lat > 120) {
        const temp = lng;
        lng = lat;
        lat = temp;
      }

      let centerName = item["센터명"] || item["안전센터"] || "의령";
      if (!['의령', '부림', '정곡'].includes(centerName)) {
        if (centerName.includes('부림')) centerName = '부림';
        else if (centerName.includes('정곡')) centerName = '정곡';
        else centerName = '의령';
      }

      const serialNum = item["표준관리번호"] || item["1번관리번호"] || item["MASTER_ID"] || "의령-1";
      const facilityType = item["시설종류"] || "지상소화전";
      const name = item["마을명"] || item["주변대상물"] || `${facilityType} (${serialNum})`;
      const address = (item["도로명주소"] || item["1번 도로명주소"] || `${item["시군명"] || "의령군"} ${item["읍면동명"] || ""} ${item["리명"] || ""}`).trim() || "의령군";

      const legal = item["법정구분"] === '비법정' ? '비법정' : '법정';

      return {
        serialNumber: String(serialNum),
        masterId: item["MASTER_ID"] ? String(item["MASTER_ID"]) : '',
        name: String(name),
        type: String(facilityType),
        legalType: legal,
        hydId: item["HYD_ID"] ? String(item["HYD_ID"]) : '',
        fireStation: item["소방서"] ? String(item["소방서"]) : '의령소방서',
        region: centerName,
        subUnit: item["지역대"] ? String(item["지역대"]) : '',
        city: item["시군명"] ? String(item["시군명"]) : '의령군',
        town: item["읍면동명"] ? String(item["읍면동명"]) : '',
        village: item["리명"] ? String(item["리명"]) : '',
        address: String(address),
        nearbyBuilding: item["주변대상물"] ? String(item["주변대상물"]) : '',
        nearbyDistance: parseFloat(item["주변대상물거리"] || "0") || 0,
        location: {
          type: 'Point',
          coordinates: [lng, lat]
        },
        diameter: item["관경"] ? String(item["관경"]) : '',
        waterPressure: item["수압"] ? String(item["수압"]) : '',
        signBoard: item["표지판설치"] ? String(item["표지판설치"]) : '×',
        protectiveFrame: item["보호틀설치"] ? String(item["보호틀설치"]) : '×',
        installDate: item["설치년도"] ? String(item["설치년도"]) : '',
        installer: item["설치자"] ? String(item["설치자"]) : '시군',
        inspector: item["점검자"] ? String(item["점검자"]) : '소방서',
        manager: item["유지관리주체"] ? String(item["유지관리주체"]) : '시군',
        matchingStatus: item["매칭상태"] ? String(item["매칭상태"]) : '자동매칭',
        matchingReason: item["매칭근거"] ? String(item["매칭근거"]) : '관리번호 완전일치',
        auditResult: item["검수필요"] === 'Y' ? '검수필요' : '정상',
        needsAudit: item["검수필요"] === 'Y' ? 'Y' : 'N',
        details: item["비고"] ? String(item["비고"]) : ''
      };
    });

    let successCount = 0;
    for (const doc of docsToInsert) {
      try {
        const fw = new FireWater(doc);
        await fw.save();
        successCount++;
      } catch (err) {
        console.warn(`[Skipped ${doc.serialNumber}]: ${err.message}`);
      }
    }
    console.log(`Successfully seeded ${successCount} / ${docsToInsert.length} FireWater records into MongoDB!`);

    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding FireWater data:', error);
    process.exit(1);
  }
}

seedFireWaterData();
