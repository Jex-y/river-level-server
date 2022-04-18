const express = require('express');
const waterLevelMeasurement = require('../models/waterLevelMeasurement');
const crypto = require('crypto');
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
 * @apiHeader {String} x-hmac-signature HMAC signature of the body of the request
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
    const hmacSignature = req.headers['x-hmac-signature'];
    const hmacSecret = process.env.SECRET;

    if (hmacSignature === undefined) {
        return res.status(401).json({message: 'Unauthorized'});
    } else {
        const hmac = crypto.createHmac('sha256', hmacSecret);
        const generatedHmac = hmac.update(JSON.stringify(req.body)).digest('hex');

        if (!crypto.timingSafeEqual(Buffer.from(hmacSignature), Buffer.from(generatedHmac))) {
            return res.status(401).json({message: 'Unauthorized'});
        }
    }
            
    if (!waterLevel) {
        return res.status(400).json({message: 'Water level is required'});
    }

    if (!Number.isFinite(waterLevel)) {
        return res.status(400).json({message: 'Water level must be a number'});
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
 * @apiSuccess {Date} waterLevelMeasurements[].timestamp Timestamp of the water level measurement
 * @apiSuccess {Number} waterLevelMeasurements[].waterLevel Water level measurement
 * @apiSuccess {Object} waterLevelMeasurements[].metadata Metadata associated with the water level measurement
 * @apiSuccess {Object} summary Summary of the water level measurements for last 24 hours
 * @apiSuccess {Number} summary.min Minimum water level measurement
 * @apiSuccess {Number} summary.max Maximum water level measurement
 * @apiSuccess {Number} summary.average Average water level measurement
 * @apiSuccess {Number} summary.count Number of water level measurements
 * 
 * @apiSuccessExample {json} Success-Response:
 *   HTTP/1.1 200 OK
 *  {
 *     "waterLevelMeasurements": [
 *         {
 *              "timestamp": "2019-01-01T00:00:00.000Z",
 *              "waterLevel": 0.4,
 *              "metadata": {
 *                  "example": "Some data"
 *              }
 *         },
 *         {
 *             "timestamp": "2019-01-01T00:01:00.000Z",
 *             "waterLevel": 0.5,
 *             "metadata": {
 *                 "example": "Some more data"
 *             }
 *         }
 *     ],
 *     "summary": {
 *         "min": 0.4,
 *         "max": 0.5,
 *         "average": 0.45,
 *         "count": 2
 *     }
 * }
 * 
 * @apiErrorExample {json} Error-Response:
 *   HTTP/1.1 500 Internal Server Error
 *  {
 *  "message": "Error getting water level measurements for last 24 hours"
 * }
 * 
**/
router.get('/waterLevelMeasurement/last24Hours', async (req, res) => {
    const all = waterLevelMeasurement.find(
        {
            timestamp: {
                $gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
            }
        },
        {
            metadata: 0,
        });

    const summary = waterLevelMeasurement.aggregate([
        {
            $match: {
                timestamp: {
                    $gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
                }
            }
        },
        {
            $group: {
                _id: null,
                average: {
                    $avg: '$waterLevel'
                },
                min: {
                    $min: '$waterLevel'
                },
                max: {
                    $max: '$waterLevel'
                },
                count: {
                    $sum: 1
                },
            }
        }
    ]);

    Promise.all([all, summary])
        .then(([all, summary]) => {
            res.status(200).send({
                waterLevelMeasurements: all,
                summary: summary[0]
            });
        })        
        .catch((error) => {
            res.status(500).send({
                message: 'Error getting water level measurements for last 24 hours',
                error
            });
        }
        );
});

// Return latest water level measurement
/**
 * @api {get} /waterLevelMeasurement/latest Get latest water level measurement
 * @apiName GetLatestWaterLevelMeasurement
 * @apiGroup WaterLevelMeasurement
 * @apiVersion 1.0.0
 * 
 * @apiSuccess {Object} waterLevelMeasurement Latest water level measurement
 * @apiSuccess {Date} waterLevelMeasurement.timestamp Timestamp of water level measurement
 * @apiSuccess {Number} waterLevelMeasurement.waterLevel Water level of water level measurement
 * 
 * @apiSuccessExample {json} Success-Response:
 *   HTTP/1.1 201 OK
 * {
 *     "timestamp": "2020-04-01T00:00:00.000Z",
 *     "waterLevel": 0.5,
 * }
 * 
 * @apiErrorExample {json} Error-Response:
 *  HTTP/1.1 500 Internal Server Error
 * {
 *     "message": "Error getting latest water level measurement"
 * }
 * 
**/

router.get('/waterLevelMeasurement/latest', async (req, res) => {
    await waterLevelMeasurement.findOne(
        {},
        {
            metadata: 0,
        })
        .sort({
            timestamp: -1
        })
        .then(
            (waterLevelMeasurement) => {
                res.status(200).send({
                    message: 'Latest water level measurement retrieved',
                    waterLevelMeasurement
                });
            })
        .catch(
            (error) => {
                res.status(500).send({
                    message: 'Error retrieving latest water level measurement',
                    error
                });
            }
        );
}); 

/**
 * @api {get} /health
 * @apiName Health
 * @apiGroup Health
 * @apiVersion 1.0.0
 * 
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 * {
 *    "message": "Health check successful"
 * }
 * 
 */
router.get('/health', (req, res) => {
    res.status(200).send({
        message: 'Health check successful'
    });
});

module.exports = router;