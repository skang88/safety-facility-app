const DrowningRisk = require('../models/DrowningRisk');

exports.getDrowningRisks = async (req, res) => {
  try {
    const { causeSub, searchQuery } = req.query;
    let filter = {};

    if (causeSub && causeSub !== '전체') {
      filter.causeSub = causeSub;
    }
    if (searchQuery) {
      filter.address = { $regex: searchQuery, $options: 'i' };
    }

    const risks = await DrowningRisk.find(filter).lean();
    res.json(risks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
