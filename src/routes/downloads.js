const express = require('express');
const waterLevelMeasurement = require('../models/waterLevelMeasurement');

const router = express.Router();

// Generate a csv file with water level measurements for last 24 hours
router.get('/waterLevelMeasurement/last24Hours', async (req, res) => {
    const now = new Date();
    const measurements = await waterLevelMeasurement.find({
        timestamp: {
            $gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
    });

    const csv = measurements.map((measurement) => {
        return `${measurement.timestamp.toISOString()},${measurement.waterLevel}`;
    });

    res.status(200).send(csv.join('\n'));
});

// Generate a csv file with all water level measurements
router.get('/waterLevelMeasurement/all', async (req, res) => {
    const measurements = await waterLevelMeasurement.find({});
    
    const csv = measurements.map((measurement) => {
        return `${measurement.timestamp.toISOString()},${measurement.waterLevel}`;
    });
    
    res.status(200).send(csv.join('\n'));
});

module.exports = router;