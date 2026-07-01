const Facility = require('./models/Facility');
const FireWater = require('./models/FireWater');
const seedData = require('./seedData.json');

const sampleFireWaters = [
  {
    serialNumber: '의령-01',
    name: '의령시장 지상소화전',
    type: '지상소화전',
    region: '의령',
    address: '의령읍 의병로18길 3-5 (의령시장 내)',
    location: {
      type: 'Point',
      coordinates: [128.2618, 35.3150]
    },
    diameter: '100',
    installDate: '2018-04-12',
    details: '의령시장 중앙 사거리 약국 앞 인도'
  },
  {
    serialNumber: '의령-02',
    name: '의령읍사무소 지하소화전',
    type: '지하소화전',
    region: '의령',
    address: '의령읍 의병로 225 (읍사무소 앞)',
    location: {
      type: 'Point',
      coordinates: [128.2600, 35.3180]
    },
    diameter: '85',
    installDate: '2015-11-20',
    details: '읍사무소 정문 우측 보도블럭 내 지하 맨홀'
  },
  {
    serialNumber: '부림-01',
    name: '부림시장 지상소화전',
    type: '지상소화전',
    region: '부림',
    address: '부림면 신반로 112 (부림시장 입구)',
    location: {
      type: 'Point',
      coordinates: [128.3242, 35.4385]
    },
    diameter: '100',
    installDate: '2020-02-14',
    details: '신반시장 버스정류장 옆 화단 앞'
  },
  {
    serialNumber: '정곡-01',
    name: '정곡면사무소 급수탑',
    type: '급수탑',
    region: '정곡',
    address: '정곡면 법정로 906 (면사무소 주차장)',
    location: {
      type: 'Point',
      coordinates: [128.3411, 35.3524]
    },
    diameter: '150',
    installDate: '2012-07-05',
    details: '면사무소 민원실 우측 화단 옆 인도'
  },
  {
    serialNumber: '의령-03',
    name: '의령소방서 비상소화장치',
    type: '비상소화장치',
    region: '의령',
    address: '의령읍 의병로 8길 10 (의령소방서)',
    location: {
      type: 'Point',
      coordinates: [128.2570, 35.3168]
    },
    diameter: '65',
    installDate: '2022-09-01',
    details: '소방서 훈련장 입구 펜스 부근'
  }
];

const seedDatabase = async () => {
  try {
    // 1. Seed Facilities
    const count = await Facility.countDocuments();
    if (count === 0) {
      console.log('No facilities found. Seeding database with initial data...');
      await Facility.insertMany(seedData);
      console.log(`Successfully seeded ${seedData.length} facilities.`);
    } else {
      console.log(`Database already has ${count} facilities. Skipping seed.`);
    }

    // 2. Seed FireWaters
    const fwCount = await FireWater.countDocuments();
    if (fwCount === 0) {
      console.log('No fire waters found. Seeding database with sample fire waters...');
      await FireWater.insertMany(sampleFireWaters);
      console.log(`Successfully seeded ${sampleFireWaters.length} fire waters.`);
    } else {
      console.log(`Database already has ${fwCount} fire waters. Skipping seed.`);
    }
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

module.exports = seedDatabase;

