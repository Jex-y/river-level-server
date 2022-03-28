const express = require('express');
const waterLevelMeasurement = require('../models/waterLevelMeasurement');

const router = express.Router();

// Endpoint for submitting water level measurement
/**
 * @api {post} /api/waterLevelMeasurement Submit water level measurement
 * @apiName SubmitWaterLevelMeasurement
 * @apiGroup WaterLevelMeasurement
 * @apiVersion 1.0.0
 * @apiDescription Submit water level measurement
 * 
 * @apiBody {Number} waterLevel Water level measurement
 * @apiBody {Object} metadata Metadata associated with the water level measurement (optional)
 * 
 * @apiSuccess {String} Water level measurement saved successfully
 * 
 * @apiSuccessExample {json} Success-Response:
 *    HTTP/1.1 200 OK
 *   {
 *    "message": "Water level measurement saved successfully"
 *  }
 * 
 * 
 * @apiErrorExample {json} Error-Response:
 *   HTTP/1.1 500 Internal Server Error
 *  {
 *   "message": "Error saving water level measurement"
 * }
 */
router.post('/waterLevelMeasurement', async (req, res) => {
    const {waterLevel, metadata} = req.body;
    if (!waterLevel) {
        return res.status(400).json({message: 'Water level is required'});
    }
    const newWaterLevelMeasurement = new waterLevelMeasurement({
        timestamp: new Date(),
        waterLevel: waterLevel,
        metadata: metadata
    });

    await newWaterLevelMeasurement.save()
        .then(() => {
            res.status(201).send({
                message: 'Water level measurement saved successfully'
            });
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send({
                message: 'Error saving water level measurement',
                error
            });
        });
});

// Endpoint for getting water level measurements for last 24 hours
/**
 * @api {get} /waterLevelMeasurement/last24Hours Get water level measurements for last 24 hours
 * @apiName GetWaterLevelMeasurementsForLast24Hours
 * @apiGroup WaterLevelMeasurement
 * @apiVersion 1.0.0
 * 
 * @apiSuccess {Object[]} waterLevelMeasurements Water level measurements for last 24 hours
 * @apiSuccess {Date} waterLevelMeasurements.timestamp Timestamp of water level measurement
 * @apiSuccess {Number} waterLevelMeasurements.waterLevel Water level of water level measurement
 * @apiSuccess {Object} waterLevelMeasurements.metadata Metadata of water level measurement
 * 
 * @apiSuccessExample {json} Success-Response:
 *    HTTP/1.1 201 OK
 * [
 *     {
 *     "timestamp": "2020-04-01T00:00:00.000Z",
 *    "waterLevel": 0.5,
 *   "metadata": {
 *    "rawReading" : 1.8,
 *      "sensorTime" : "2020-04-01T00:00:00.000Z",
 *      }
 *   },
 *   {
 *      "timestamp": "2020-04-01T01:00:00.000Z",
 *      "waterLevel": 0.5,
 *      "metadata": {
 *          "rawReading" : 1.8,
 *          "sensorTime" : "2020-04-01T01:00:00.000Z",
 *          }
 *  }
 * ]
 * 
 * @apiErrorExample {json} Error-Response:
 *   HTTP/1.1 500 Internal Server Error
 *  {
 *  "message": "Error getting water level measurements for last 24 hours"
 * }
 * 
**/
router.get('/waterLevelMeasurement/last24Hours', async (req, res) => {
    await waterLevelMeasurement.find(
        {
            timestamp: {
                $gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
            }
        },
        {
            metadata: 0,
        })
        .then(
            (waterLevelMeasurements) => {
                res.status(200).send({
                    message: 'Water level measurements retrieved',
                    waterLevelMeasurements
                });
            })
        .catch(
            (error) => {
                res.status(500).send({
                    message: 'Error retrieving water level measurements',
                    error
                });
            }
        );
});

router.get('/health', (req, res) => {
    res.status(200).send({
        message: 'Health check successful'
    });
});

module.exports = router;