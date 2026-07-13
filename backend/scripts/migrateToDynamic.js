const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const FireStation = require('../models/FireStation');
const Center = require('../models/Center');
const Category = require('../models/Category');
const Facility = require('../models/Facility');
const Inspection = require('../models/Inspection');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/safety_facilities';

async function migrate() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB.');

    // 1. Create or Find FireStation (의령소방서)
    let station = await FireStation.findOne({ name: '의령소방서' });
    if (!station) {
      station = new FireStation({ name: '의령소방서' });
      await station.save();
      console.log('Created FireStation: 의령소방서');
    } else {
      console.log('Found existing FireStation: 의령소방서');
    }

    // 2. Create or Find Centers
    const centerNames = ['의령', '부림', '정곡'];
    const centerMap = {};
    for (const name of centerNames) {
      const fullName = `${name}119안전센터`;
      let center = await Center.findOne({ fireStation: station._id, name: fullName });
      if (!center) {
        center = new Center({ fireStation: station._id, name: fullName });
        await center.save();
        console.log(`Created Center: ${fullName}`);
      } else {
        console.log(`Found existing Center: ${fullName}`);
      }
      centerMap[name] = center._id;
    }

    // 3. Create or Find Category (수난인명구조장비함)
    let category = await Category.findOne({ key: 'water_rescue' });
    if (!category) {
      category = new Category({
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
      await category.save();
      console.log('Created Category: 수난인명구조장비함');
    } else {
      console.log('Found existing Category: 수난인명구조장비함');
    }

    // 4. Migrate Facilities
    const facilities = await Facility.find();
    console.log(`Migrating ${facilities.length} facilities...`);
    for (const fac of facilities) {
      let isUpdated = false;

      if (!fac.category) {
        fac.category = category._id;
        isUpdated = true;
      }
      if (!fac.fireStation) {
        fac.fireStation = station._id;
        isUpdated = true;
      }
      if (!fac.center) {
        // Map region ('의령', '부림', '정곡') to Center ID
        const centerId = centerMap[fac.region];
        if (centerId) {
          fac.center = centerId;
          isUpdated = true;
        } else {
          // Default to '의령' Center if region is not matching
          fac.center = centerMap['의령'];
          isUpdated = true;
        }
      }

      if (isUpdated) {
        // Mark baseItems Map as modified just in case
        fac.markModified('baseItems');
        await fac.save();
      }
    }
    console.log('Facilities migration completed.');

    // 5. Migrate Inspections
    const inspections = await Inspection.find();
    console.log(`Migrating ${inspections.length} inspections...`);
    for (const insp of inspections) {
      let isUpdated = false;
      
      // If photos array is empty but we have individual paths, migrate them
      if ((!insp.photos || insp.photos.length === 0) && (insp.externalPhotoPath || insp.internalPhotoPath)) {
        insp.photos = [];
        if (insp.externalPhotoPath) {
          insp.photos.push({ label: '외부 사진', path: insp.externalPhotoPath });
        }
        if (insp.internalPhotoPath) {
          insp.photos.push({ label: '내부 사진', path: insp.internalPhotoPath });
        }
        isUpdated = true;
      }

      if (isUpdated) {
        insp.markModified('itemsStatus');
        insp.markModified('photos');
        await insp.save();
      }
    }
    console.log('Inspections migration completed.');

    console.log('Migration process successfully finished!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected.');
  }
}

migrate();
