const express = require('express');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const cors = require('cors');
const path = require('path');
const api = require('./routes/api');
const downloads = require('./routes/downloads');

const app = express();

app.use(morgan('short', {
    skip: (req, _res) => process.env.TEST || req.originalUrl === '/api/health' 
}));

app.use(cors());
app.use(express.json());

const apiRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests, please try again later.',
});

app.use(express.static(path.join(__dirname, './static'),
    {
        extensions: ['html'],
        index: 'index.html'
    }
));

app.use('/api', apiRateLimit, api);
app.use('/downloads', apiRateLimit, downloads);
app.use('/docs', express.static('docs'));
module.exports = app;