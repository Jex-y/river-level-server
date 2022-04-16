require('dotenv').config();
const supertest = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = require('../src/app');
const waterLevelMeasurement = require('../src/models/waterLevelMeasurement');

describe('Test CSV generation for downloads', () => {
    let db = mongoose;
    let mongod;

    let server = supertest(app);

    beforeAll(async () => {
        mongod = await MongoMemoryServer.create();
        db = await db.connect(mongod.getUri(), {});
    });

    afterEach(async () => {
        const collections = db.connection.collections;
        for (const key in collections) {
            const collection = collections[key];
            try {
                await collection.drop();
            } catch (error) {
                'pass';
                // Collection was empty   
            }
        }
    });

    afterAll(async () => {
        await db.connection.dropDatabase();
        await db.connection.close();
        await mongod.stop();
    });

    test('Test download last 24 hours', async () => {
        const now = new Date();

        const testMeasurement1 = new waterLevelMeasurement({
            timestamp: new Date(new Date().setMinutes(now.getMinutes() - 1)),
            waterLevel: 0.4,
            metadata: {
                example: 'Some data',
            }
        });

        await testMeasurement1.save();

        const testMeasurement2 = new waterLevelMeasurement({
            timestamp: new Date(),
            waterLevel: 0.5,
            metadata: {
                example: 'Some more data',
            }
        });

        await testMeasurement2.save();

        // This one should be excluded as it is more than 24 hours old
        const testMeasurement3 = new waterLevelMeasurement({
            timestamp: new Date(new Date().setDate(now.getDate() - 1)),
            waterLevel: 0.6,
            metadata: {
                example: 'Even more data'
            }
        });

        await testMeasurement3.save();

        const measurements = await waterLevelMeasurement.find({
            timestamp: {
                $gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
        });

        const csv = [
            'timestamp,water level',
            ...measurements.map((measurement) => {
                return `${measurement.timestamp.toISOString()},${measurement.waterLevel}`;
            }),
        ];

        const response = await server.get('/downloads/waterLevelMeasurement/last24Hours');
        expect(response.statusCode).toBe(200);
        expect(response.text).toBe(csv.join('\n'));
    });

    test('Test download all', async () => {
        const now = new Date();
        
        const testMeasurement1 = new waterLevelMeasurement({
            timestamp: new Date(new Date().setMinutes(now.getMinutes() - 1)),
            waterLevel: 0.4,
            metadata: {
                example: 'Some data',
            }
        });

        await testMeasurement1.save();

        const testMeasurement2 = new waterLevelMeasurement({
            timestamp: new Date(),
            waterLevel: 0.5,
            metadata: {
                example: 'Some more data',
            }
        });

        await testMeasurement2.save();

        const testMeasurement3 = new waterLevelMeasurement({
            timestamp: new Date(new Date().setDate(now.getDate() - 1)),
            waterLevel: 0.6,
            metadata: {
                example: 'Even more data'
            }
        });

        await testMeasurement3.save();

        const measurements = await waterLevelMeasurement.find({});
        
        const csv = [
            'timestamp,water level',
            ...measurements.map((measurement) => {
                return `${measurement.timestamp.toISOString()},${measurement.waterLevel}`;
            }),
        ];

        const response = await server.get('/downloads/waterLevelMeasurement/all');
        expect(response.statusCode).toBe(200);
        expect(response.text).toBe(csv.join('\n'));
    });
});