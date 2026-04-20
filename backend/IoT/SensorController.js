const SensorData = require('./SensorModel');

// GET /api/data/:type
// Returns the latest reading per room for the given sensor type
const getLatestByType = async (req, res) => {
  const { type } = req.params;
  const validTypes = ['temperature', 'gas', 'light', 'garbage'];

  if (!validTypes.includes(type)) {
    return res.status(400).json({ message: 'Invalid sensor type.' });
  }

  try {
    const results = await SensorData.aggregate([
      { $match: { type } },
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: '$roomId',
          roomId:    { $first: '$roomId' },
          value:     { $first: '$value' },
          timestamp: { $first: '$timestamp' },
        },
      },
      { $project: { _id: 0, roomId: 1, value: 1, timestamp: 1 } },
    ]);

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { getLatestByType };
