require('dotenv').config();
const db = require('./database/database');
const bodyParser = require('body-parser');
const appLogger = require('./middleware/logger');
const express = require('express');
app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(appLogger);
app.post('/courses', (request, response) => {
    const query = `INSERT INTO courses(id, course_name, course_number, department_abbr,
        semester, year, join_code) VALUES ($1, $2, $3, $4, $5, $6, $7)`;
    const courseObject = [request.body.id, request.body.course_name, request.body.course_number, request.body.department_abbr, request.body.semester,
        request.body.year, request.body.join_code];
    db.query(query, courseObject, (error, response) => {
        if (error) console.error(error);
        else console.log(response.rows[0]);
    });
});
app.get('/courses', (request, response) => {
    const query = `SELECT * FROM courses`;
    db.query(query, (error, result) => {
        if (error) console.error(error);
        else response.send(result.rows);
    })
})

app.listen(process.env.APP_PORT, () => console.log(`${process.env.APP_NAME} v${process.env.APP_VERS} 
Running on Port ${process.env.APP_PORT}`));