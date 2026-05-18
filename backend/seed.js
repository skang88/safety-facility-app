const Facility = require('./models/Facility');
const seedData = require('./seedData.json');

const seedDatabase = async () => {
  try {
    const count = await Facility.countDocuments();
    if (count === 0) {
      console.log('No facilities found. Seeding database with initial data...');
      await Facility.insertMany(seedData);
      console.log(`Successfully seeded ${seedData.length} facilities.`);
    } else {
      console.log(`Database already has ${count} facilities. Skipping seed.`);
    }
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

module.exports = seedDatabase;
