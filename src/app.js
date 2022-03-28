const express = require('express');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

const api = require('./routes/api');

const app = express();

console.log('Starting logger');
app.use(morgan('dev'));

app.use(express.json());

const apiRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests, please try again later.',
});

app.use('/api', apiRateLimit, api);



module.exports = app;