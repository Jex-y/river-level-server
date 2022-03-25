require('dotenv-flow').config();

const http = require('http');
const mongoose = require('mongoose');

const app = require('./src/app');

mongoose.connect(process.env.DB_URI, {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.connection.on('error', console.error.bind(console, 'MongoDB connection error:'));

const server = http.createServer(app);

const port = process.env.SERVER_PORT;
const host = process.env.SERVER_HOST;

server.listen(port, host, () => {
    logging.info(`Server started. Listening on http://${host}:${port}`);    
});

module.exports = { server };