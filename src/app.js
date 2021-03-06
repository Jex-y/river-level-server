const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const path = require('path');
const api = require('./routes/api');
const downloads = require('./routes/downloads');

morgan.token('viewer-address', (req) => {
    return req.headers['cloudfront-viewer-address'] || 
        req.ip ||
        req._remoteAddress ||
        (req.connection && req.connection.remoteAddress) ||
        undefined;
});

morgan.token('viewer-location', (req) => {
    const country = req.headers['cloudfront-viewer-country'] || '-';
    const city = req.headers['cloudfront-viewer-city'] || '-';
    return `${country}/${city}`;
});

const app = express();

app.use(morgan(
    ':viewer-address (:viewer-location) :method :url HTTP/:http-version :status -> :response-time ms', {
        skip: (req, _res) => process.env.TEST || req.originalUrl === '/api/health' 
    }));



app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, './static'),
    {
        extensions: ['html'],
        index: 'index.html'
    }
));

app.use('/api', api);
app.use('/downloads', downloads);
app.use('/docs', express.static('docs'));
module.exports = app;