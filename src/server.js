const mongoose = require('mongoose');
const path = require('path');
const app = require('./app');


const {
    DB_HOST,
    DB_NAME,
    DB_USER,
    DB_PASS,
    DB_PORT
} = process.env;

const db_uri = `mongodb://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}?authSource=admin`;

mongoose.connect(
    db_uri,
    { useNewUrlParser: true, useUnifiedTopology: true })
    .catch(error => {
        console.error('Error connecting to database:', error);
        process.exit(1);
    });

require('greenlock-express').init({
    packageRoot: path.join(__dirname, '../'),
    configDir: path.join(__dirname, '../greenlock.d'),
    maintainerEmail: 'edward.j.jex@durham.ac.uk',
    cluster: false
}).serve(app);