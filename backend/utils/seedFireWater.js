const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config();

const FireWater = require('../models/FireWater');

async function seedFireWaterData(force = false) {
  try {
    const count = await FireWater.countDocuments();
    if (count > 0 && !force) {
      console.log(`[FireWater] Already seeded (${count} records in DB). Skipping.`);
      return;
    }

    if (force && count > 0) {
      await FireWater.deleteMany({});
      console.log('[FireWater] Force clearing existing collection...');
    }

    // 1. Try reading from reference HTML file
    const refHtmlPath = path.join(__dirname, '..', '..', 'reference', '소방용수_통합관리_기능검수_단일웹_v5.4.4.html');
    let masterItems = [];

    if (fs.existsSync(refHtmlPath)) {
      console.log('[FireWater] Extracting 329 master records from reference HTML file...');
      const htmlContent = fs.readFileSync(refHtmlPath, 'utf8');
      const match = htmlContent.match(/window\.FIREWATER_DATA\s*=\s*(\{[\s\S]*?\});/);

      if (match) {
        try {
          const rawData = JSON.parse(match[1]);
          masterItems = rawData.master || [];
        } catch (e) {
          console.error('[FireWater] Failed to parse HTML FIREWATER_DATA JSON:', e.message);
        }
      }
    }

    // 2. Fallback: try seedData JSON file if available
    const jsonPath = path.join(__dirname, '..', 'seedData', 'fireWaterGyeongnam.json');
    if (masterItems.length === 0 && fs.existsSync(jsonPath)) {
      console.log('[FireWater] Reading from seedData/fireWaterGyeongnam.json...');
      const rawData = fs.readFileSync(jsonPath, 'utf8');
      masterItems = JSON.parse(rawData);
    }

    if (masterItems.length === 0) {
      console.warn('[FireWater] No master records found in HTML or JSON.');
      return;
    }

    const docsToInsert = masterItems.map(item => {
      let lng = parseFloat(item["경도"] || item["X좌표"] || item["location"]?.coordinates?.[0] || "128.2570");
      let lat = parseFloat(item["위도"] || item["Y좌표"] || item["location"]?.coordinates?.[1] || "35.3168");
      
      if (isNaN(lng) || lng === 0) lng = 128.2570;
      if (isNaN(lat) || lat === 0) lat = 35.3168;

      // Auto-correct inverted lat/lng coordinates if present in source data
      if (lng < 45 && lat > 120) {
        const temp = lng;
        lng = lat;
        lat = temp;
      }

      let centerName = item["센터명"] || item["안전센터"] || item["region"] || "의령";
      if (!['의령', '부림', '정곡'].includes(centerName)) {
        if (centerName.includes('부림')) centerName = '부림';
        else if (centerName.includes('정곡')) centerName = '정곡';
        else centerName = '의령';
      }

      const serialNum = item["표준관리번호"] || item["1번관리번호"] || item["MASTER_ID"] || item["serialNumber"] || "의령-1";
      const facilityType = item["시설종류"] || item["type"] || "지상소화전";
      const name = item["마을명"] || item["주변대상물"] || item["name"] || `${facilityType} (${serialNum})`;
      const address = (item["도로명주소"] || item["1번 도로명주소"] || item["address"] || `${item["시군명"] || "의령군"} ${item["읍면동명"] || ""} ${item["리명"] || ""}`).trim() || "의령군";

      const legal = (item["법정구분"] || item["legalType"]) === '비법정' ? '비법정' : '법정';

      return {
        serialNumber: String(serialNum),
        masterId: item["MASTER_ID"] || item["masterId"] ? String(item["MASTER_ID"] || item["masterId"]) : '',
        name: String(name),
        type: String(facilityType),
        legalType: legal,
        hydId: item["HYD_ID"] || item["hydId"] ? String(item["HYD_ID"] || item["hydId"]) : '',
        fireStation: item["소방서"] || item["fireStation"] ? String(item["소방서"] || item["fireStation"]) : '의령소방서',
        region: centerName,
        subUnit: item["지역대"] || item["subUnit"] ? String(item["지역대"] || item["subUnit"]) : '',
        city: item["시군명"] || item["city"] ? String(item["시군명"] || item["city"]) : '의령군',
        town: item["읍면동명"] || item["town"] ? String(item["읍면동명"] || item["town"]) : '',
        village: item["리명"] || item["village"] ? String(item["리명"] || item["village"]) : '',
        address: String(address),
        nearbyBuilding: item["주변대상물"] || item["nearbyBuilding"] ? String(item["주변대상물"] || item["nearbyBuilding"]) : '',
        nearbyDistance: parseFloat(item["주변대상물거리"] || item["nearbyDistance"] || "0") || 0,
        location: {
          type: 'Point',
          coordinates: [lng, lat]
        },
        diameter: item["관경"] ? String(item["관경"]) : item["diameter"] || '',
        waterPressure: item["수압"] ? String(item["수압"]) : item["waterPressure"] || '',
        signBoard: item["표지판설치"] ? String(item["표지판설치"]) : item["signBoard"] || '×',
        protectiveFrame: item["보호틀설치"] ? String(item["보호틀설치"]) : item["protectiveFrame"] || '×',
        installDate: item["설치년도"] ? String(item["설치년도"]) : item["installDate"] || '',
        installer: item["설치자"] ? String(item["설치자"]) : item["installer"] || '시군',
        inspector: item["점검자"] ? String(item["점검자"]) : item["inspector"] || '소방서',
        manager: item["유지관리주체"] ? String(item["유지관리주체"]) : item["manager"] || '시군',
        matchingStatus: item["매칭상태"] ? String(item["매칭상태"]) : item["matchingStatus"] || '자동매칭',
        matchingReason: item["매칭근거"] ? String(item["매칭근거"]) : item["matchingReason"] || '관리번호 완전일치',
        auditResult: item["검수필요"] === 'Y' || item["needsAudit"] === 'Y' ? '검수필요' : '정상',
        needsAudit: item["검수필요"] === 'Y' || item["needsAudit"] === 'Y' ? 'Y' : 'N',
        details: item["비고"] ? String(item["비고"]) : item["details"] || ''
      };
    });

    let successCount = 0;
    for (const doc of docsToInsert) {
      try {
        const fw = new FireWater(doc);
        await fw.save();
        successCount++;
      } catch (err) {
        console.warn(`[FireWater Skip ${doc.serialNumber}]: ${err.message}`);
      }
    }
    console.log(`[FireWater] Successfully auto-seeded ${successCount} / ${docsToInsert.length} records into MongoDB!`);
  } catch (error) {
    console.error('[FireWater] Error seeding fire water data:', error);
  }
}

module.exports = seedFireWaterData;
