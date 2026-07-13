const Facility = require('./models/Facility');
const FireStation = require('./models/FireStation');
const Center = require('./models/Center');
const Category = require('./models/Category');
const seedData = require('./seedData.json');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const seedDatabase = async () => {
  try {
    // 1. Create FireStation
    let station = await FireStation.findOne({ name: '의령소방서' });
    if (!station) {
      station = new FireStation({ name: '의령소방서' });
      await station.save();
      console.log('Seed: Created FireStation 의령소방서');
    }

    // 2. Create Centers
    const centerNames = ['의령', '부림', '정곡'];
    const centerMap = {};
    for (const name of centerNames) {
      const fullName = `${name}119안전센터`;
      let center = await Center.findOne({ fireStation: station._id, name: fullName });
      if (!center) {
        center = new Center({ fireStation: station._id, name: fullName });
        await center.save();
        console.log(`Seed: Created Center ${fullName}`);
      }
      centerMap[name] = center._id;
    }

    // 3. Create Categories
    
    // Category 1: 수난인명구조장비함 (water_rescue)
    let waterRescueCat = await Category.findOne({ key: 'water_rescue' });
    if (!waterRescueCat) {
      waterRescueCat = new Category({
        name: '수난인명구조장비함',
        key: 'water_rescue',
        icon: 'LifeBuoy',
        baseItemFields: [
          { key: 'lifebuoy', label: '구명환', type: 'number' },
          { key: 'lifeJacket', label: '구명조끼', type: 'number' },
          { key: 'lifeline', label: '구명줄', type: 'number' },
          { key: 'throwBag', label: '드로우백', type: 'number' }
        ],
        inspectionFields: [
          { key: 'lifebuoy', label: '구명환 상태', type: 'select', options: ['양호', '불량', '없음'] },
          { key: 'lifeJacket', label: '구명조끼 상태', type: 'select', options: ['양호', '불량', '없음'] },
          { key: 'lifeline', label: '구명줄 상태', type: 'select', options: ['양호', '불량', '없음'] },
          { key: 'throwBag', label: '드로우백 상태', type: 'select', options: ['양호', '불량', '없음'] }
        ],
        photoLabels: ['외부 사진', '내부 사진']
      });
      await waterRescueCat.save();
      console.log('Seed: Created Category 수난인명구조장비함');
    }

    // Category 2: 산악간이구급함 (mountain_kit)
    let mountainKitCat = await Category.findOne({ key: 'mountain_kit' });
    if (!mountainKitCat) {
      mountainKitCat = new Category({
        name: '산악간이구급함',
        key: 'mountain_kit',
        icon: 'Briefcase',
        baseItemFields: [
          { key: 'installYear', label: '설치년도', type: 'string' },
          { key: 'installed', label: '설치여부', type: 'string' },
          { key: 'password', label: '비밀번호', type: 'string' },
          { key: 'telecom', label: '통신사', type: 'string' },
          { key: 'contact', label: '연락처', type: 'string' }
        ],
        inspectionFields: [
          { key: 'boxStatus', label: '함 관리상태', type: 'select', options: ['양호', '정비필요', '교체대상', '철거대상'] },
          { key: 'drugStatus', label: '구급약품 상태', type: 'select', options: ['양호', '부족', '없음'] },
          { key: 'improvement', label: '개선여부', type: 'select', options: ['완료', '미완료', '해당없음'] },
          { key: 'manager', label: '전담관리자 지정', type: 'select', options: ['지정', '미지정'] }
        ],
        photoLabels: ['외부 사진', '내부 사진']
      });
      await mountainKitCat.save();
      console.log('Seed: Created Category 산악간이구급함');
    }

    // Category 3: 산악위치표지판 (mountain_sign)
    let mountainSignCat = await Category.findOne({ key: 'mountain_sign' });
    if (!mountainSignCat) {
      mountainSignCat = new Category({
        name: '산악위치표지판',
        key: 'mountain_sign',
        icon: 'MapPin',
        baseItemFields: [
          { key: 'serialNum', label: '일련번호', type: 'string' },
          { key: 'shape', label: '형태', type: 'string' },
          { key: 'nationalGridNum', label: '국가지점번호', type: 'string' },
          { key: 'gridDistance', label: '직선거리(M)', type: 'number' },
          { key: 'sktStatus', label: 'SKT 신고가능 여부', type: 'string' },
          { key: 'ktStatus', label: 'KT 신고가능 여부', type: 'string' },
          { key: 'lguStatus', label: 'LGU+ 신고가능 여부', type: 'string' }
        ],
        inspectionFields: [
          { key: 'signStatus', label: '표지판 관리상태', type: 'select', options: ['양호', '정비필요', '교체대상', '철거대상'] },
          { key: 'sktSignal', label: 'SKT 통신상태', type: 'select', options: ['양호', '불량'] },
          { key: 'ktSignal', label: 'KT 통신상태', type: 'select', options: ['양호', '불량'] },
          { key: 'lguSignal', label: 'LGU+ 통신상태', type: 'select', options: ['양호', '불량'] },
          { key: 'manager', label: '전담관리자 지정', type: 'select', options: ['지정', '미지정'] }
        ],
        photoLabels: ['외부 사진', '내부 사진']
      });
      await mountainSignCat.save();
      console.log('Seed: Created Category 산악위치표지판');
    }

    // 4. Seed Facilities by Category

    // 4.1 Seed Water Rescue Facilities
    const waterRescueCount = await Facility.countDocuments({ category: waterRescueCat._id });
    if (waterRescueCount === 0) {
      console.log('Seed: Seeding water rescue facilities...');
      const enrichedData = seedData.map(item => {
        const centerId = centerMap[item.region] || centerMap['의령'];
        return {
          ...item,
          category: waterRescueCat._id,
          fireStation: station._id,
          center: centerId
        };
      });
      await Facility.insertMany(enrichedData);
      console.log(`Seed: Successfully seeded ${seedData.length} water rescue facilities.`);
    }

    // 4.2 Seed Mountain First Aid Kits (간이구급함)
    const kitCount = await Facility.countDocuments({ category: mountainKitCat._id });
    if (kitCount === 0) {
      const kitCsvPath = path.join(__dirname, '산악안전시설물 관리 현황(간이구급함).csv');
      if (fs.existsSync(kitCsvPath)) {
        console.log('Seed: Seeding mountain first aid kits...');
        const wb = xlsx.readFile(kitCsvPath);
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
        
        const kitFacilities = [];
        // Skip header (index 0)
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length < 5) continue;
          
          const dept = row[17] || '';
          let region = '의령';
          if (dept.includes('부림')) region = '부림';
          else if (dept.includes('정곡')) region = '정곡';
          
          const mountain = row[3] || '';
          const detailLoc = row[4] || '';
          const name = `${mountain} 간이구급함 - ${row[0]} (${detailLoc})`;
          
          const baseItems = {
            installYear: String(row[5] || ''),
            installed: String(row[7] || ''),
            password: String(row[8] || ''),
            telecom: String(row[10] || ''),
            contact: String(row[18] || '')
          };

          kitFacilities.push({
            category: mountainKitCat._id,
            fireStation: station._id,
            center: centerMap[region] || centerMap['의령'],
            name,
            region,
            location: {
              type: 'Point',
              coordinates: [128.1916667, 35.36] // Default coordinates
            },
            baseItems
          });
        }
        
        if (kitFacilities.length > 0) {
          await Facility.insertMany(kitFacilities);
          console.log(`Seed: Successfully seeded ${kitFacilities.length} mountain kits.`);
        }
      } else {
        console.log(`Seed: Mountain kit CSV not found at ${kitCsvPath}`);
      }
    }

    // 4.3 Seed Mountain Location Signposts (산악위치표지판)
    const signCount = await Facility.countDocuments({ category: mountainSignCat._id });
    if (signCount === 0) {
      const signCsvPath = path.join(__dirname, '산악안전시설물 관리 현황(산악위치표지판).csv');
      if (fs.existsSync(signCsvPath)) {
        console.log('Seed: Seeding mountain location signposts...');
        const wb = xlsx.readFile(signCsvPath);
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
        
        const signFacilities = [];
        // Skip header (index 0)
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length < 9) continue;
          
          const dept = row[24] || '';
          let region = '의령';
          if (dept.includes('부림')) region = '부림';
          else if (dept.includes('정곡')) region = '정곡';
          
          const name = row[8] || `산악위치표지판 - ${row[0]}`;
          const address = row[4] || '';
          const detailLoc = row[5] || '';
          const fullName = `${name} (${address} ${detailLoc})`;
          
          const lat = parseFloat(row[6]);
          const lon = parseFloat(row[7]);
          if (isNaN(lat) || isNaN(lon)) continue;
          
          const commsIssue = String(row[17] || '').trim();
          const reportable = commsIssue === 'X' ? '가능' : '불가';
          
          const baseItems = {
            serialNum: String(row[8] || ''),
            shape: String(row[10] || ''),
            nationalGridNum: String(row[12] || ''),
            gridDistance: row[13] ? Number(row[13]) : 0,
            sktStatus: reportable,
            ktStatus: reportable,
            lguStatus: reportable
          };

          signFacilities.push({
            category: mountainSignCat._id,
            fireStation: station._id,
            center: centerMap[region] || centerMap['의령'],
            name: fullName,
            region,
            location: {
              type: 'Point',
              coordinates: [lon, lat]
            },
            baseItems
          });
        }
        
        if (signFacilities.length > 0) {
          await Facility.insertMany(signFacilities);
          console.log(`Seed: Successfully seeded ${signFacilities.length} mountain signs.`);
        }
      } else {
        console.log(`Seed: Mountain sign CSV not found at ${signCsvPath}`);
      }
    }

  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

module.exports = seedDatabase;
