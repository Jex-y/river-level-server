const http = require('http');
const mongoose = require('mongoose');
const morgan = require('morgan');

const app = require('./app');

/* eslint-disable no-console */

app.use(morgan('dev'));

const {
    PORT_HTTP,
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

const server = http.createServer(app);

server.listen(
    PORT_HTTP,
    () => {
        console.log(`Server started. Listening on http://${server.address().address}:${PORT_HTTP}`);
    });

module.exports = { server };