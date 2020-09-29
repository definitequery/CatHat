require('dotenv').config();
const database = require('./database/database');
const appLogger = require('./middleware/logger');
const express = require('express');
app = express();

app.use(appLogger);
app.use('/', express.static('static'));
app.get('/database', (request, response) => {
    database.all(`SELECT * FROM test_table`, (error, row) => {
        if (error) throw error;
        response.send(row);
    });
});

app.listen(process.env.APP_PORT, () => console.log(`${process.env.APP_NAME} v${process.env.APP_VERS} 
Running on Port ${process.env.APP_PORT}`));