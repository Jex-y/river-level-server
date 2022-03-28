require('dotenv').config();
const supertest = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = require('../src/app');
const waterLevelMeasurement = require('../src/models/waterLevelMeasurement');

describe('Test water level measurements API', () => {
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

    test('Test water level measurement submission with no water level', async () => {
        const response = await server.post('/api/waterLevelMeasurement')
            .send({
                metadata: {
                    example1: 'Some data',
                    example2: 'Some more data'
                }
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe('Water level is required');
    });

    test('Test water level measurement retrieval for last 24 hours', async () => {
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

    test('Test latest water level measurement retrieval', async () => {
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

        const response = await server.get('/api/waterLevelMeasurement/latest');
        expect(response.statusCode).toBe(200);
        expect(response.body.waterLevelMeasurement).toMatchObject({
            timestamp: testMeasurement2.timestamp.toISOString(),
            waterLevel: testMeasurement2.waterLevel
        });
        expect(response.body.waterLevelMeasurement.metadata).toBeUndefined();

    });

    test('Test water level measurement retrieval for last 24 without data', async () => {
        const response = await server.get('/api/waterLevelMeasurement/last24Hours');
        expect(response.statusCode).toBe(200);
        expect(response.body.waterLevelMeasurements).toHaveLength(0);
    });
});

describe('Test health check API', () => {
    let server = supertest(app);

    test('Test health check', async () => {
        const response = await server.get('/api/health');
        expect(response.statusCode).toBe(200);
        expect(response.body).toMatchObject({
            message: 'Health check successful'
        });
    });
});

describe('Test water level measurements with database error', () => {
    let server = supertest(app);

    test('Test water level measurement submission with database error', async () => {
        const response = await server.post('/api/waterLevelMeasurement')
            .send({
                waterLevel: 4.2,
                metadata: {
                    example1: 'Some data',
                    example2: 'Some more data'
                }
            });

        expect(response.statusCode).toBe(500);
        expect(response.body.message).toBe('Error saving water level measurement');
    });

    test('Test latest water level measurement retrieval with database error', async () => {
        const response = await server.get('/api/waterLevelMeasurement/latest');
        expect(response.statusCode).toBe(500);
        expect(response.body.message).toBe('Error retrieving latest water level measurement');
    });

    test('Test water level measurement retrieval with database error', async () => {
        const response = await server.get('/api/waterLevelMeasurement/last24Hours');
        expect(response.statusCode).toBe(500);
        expect(response.body.message).toBe('Error retrieving water level measurements');
    });
});