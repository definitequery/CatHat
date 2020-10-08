require('dotenv').config();
const db = require('./database/database')
const appLogger = require('./middleware/logger');
const express = require('express');
app = express();

app.use(appLogger);
app.use('/', express.static('static'));
app.get('/database', (request, response) => {
    db.query('SELECT * FROM users')
        .then(res => response.send(res.rows))
        .catch(e => console.error(e));
});

app.listen(process.env.APP_PORT, () => console.log(`${process.env.APP_NAME} v${process.env.APP_VERS} 
Running on Port ${process.env.APP_PORT}`));