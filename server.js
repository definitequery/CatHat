require('dotenv').config();
const appLogger = require('./middleware/logger');
const express = require('express');
app = express();

app.use('/', express.static('static'));
app.use(appLogger);
app.listen(process.env.APP_PORT, () => console.log(`${process.env.APP_NAME} v${process.env.APP_VERS} 
Running on Port ${process.env.APP_PORT}`));