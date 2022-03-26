require('dotenv-flow').config();
const supertest = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = require('../src/app');
const waterLevelMeasurement = require('../src/models/waterLevelMeasurement');

describe('Test water level measurements API', () => {
    let db = mongoose;
    let mongod;

    server = supertest(app);

    beforeAll(async () => {
        mongod = await MongoMemoryServer.create();
        db = await db.connect(mongod.getUri(), {});
    });

    afterEach(async () => {
        const collections = db.connection.collections;
        for (const key in collections) {
            const collection = collections[key];
            await collection.drop();
        }
    });

    afterAll(async () => {
        await db.connection.dropDatabase();
        await db.connection.close();
        await mongod.stop();
    });

    test('Test water level measurement submission', async () => {
        const response = await server.post('/api/waterLevelMeasurement')
            .send({
                waterLevel: 4.2,
                metadata: {
                    example1: 'Some data',
                    example2: 'Some more data'
                }
            });

        expect(response.statusCode).toBe(201);
        expect(response.body.message).toBe('Water level measurement saved successfully');
    });

    test('Test water level measurement retrieval for last 24 hours', async () => {
        const now = new Date()
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

        await testMeasurement3.save()

        const response = await server.get('/api/waterLevelMeasurement/last24Hours');
        expect(response.statusCode).toBe(200);
        expect(response.body.waterLevelMeasurements).toHaveLength(2);
        expect(response.body).toMatchObject({
            waterLevelMeasurements: [
                {
                    timestamp: testMeasurement1.timestamp.toISOString(),
                    waterLevel: testMeasurement1.waterLevel,
                },
                {
                    timestamp: testMeasurement2.timestamp.toISOString(),
                    waterLevel: testMeasurement2.waterLevel,
                }
            ]
        });
        expect(response.body.waterLevelMeasurements[0].metadata).toBeUndefined();
    });
});