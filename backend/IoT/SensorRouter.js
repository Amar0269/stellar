const express = require('express');
const router = express.Router();
const verifyToken = require('./verifyToken');
const { getLatestByType } = require('./SensorController');

// GET /api/data/:type
router.get('/:type', verifyToken, getLatestByType);

module.exports = router;
