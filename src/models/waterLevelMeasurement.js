const mongoose = require('mongoose');

const schema = mongoose.Schema;

const waterLevelMeasurementSchema = new schema(
    { timestamp: Date, waterLevel: Number, metadata: Object }, {
    timeseries: {
        timeField: 'timestamp',
        metaField: 'metadata',
        granularity: 'minutes'
    }
});

const waterLevelMeasurement = mongoose.model('waterLevelMeasurement', waterLevelMeasurementSchema);
module.exports = waterLevelMeasurement;