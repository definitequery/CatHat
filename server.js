require('dotenv').config();
const exphbs = require('express-handlebars');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const appLogger = require('./middleware/logger');
const db = require('./database/database');
const express = require('express');
app = express();

app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(appLogger);

app.get('/', (req, res) => res.render('home'));
app.get('/courses/:user_id', (req, res) => {
    const query = `SELECT * FROM "Courses" C INNER JOIN "Courses_Users" CU ON CU.course_id = C.course_id WHERE CU.user_id = $1`;
    db.query(query, [req.params.user_id], (error, result) => {
        if (error) {
            res.send("Data retrieval failed!");
            throw error;
        } else {
            res.render('courses', {courses: result.rows});
        };
    });
});
app.post('/courses', (req, res) => {
    const course = [req.body.course_name, req.body.start_date, req.body.end_date, req.body.subject, 
        req.body.course_code, req.body.description, req.body.join_code];
    const query = `INSERT INTO "Courses"(course_name, start_date, end_date, subject, course_code, 
        description, join_code) VALUES ($1, $2, $3, $4, $5, $6, $7)`;
    db.query(query, course, (error, result) => {
        if (error) {
            res.send("Data insertion failed!");
            throw error;
        } else {
            res.send(`Data insertion completed successfuly! - ${JSON.stringify(result)}`);
        };
    });
});

app.listen(process.env.APP_PORT || 8080, () => console.log(`${process.env.APP_NAME} v${process.env.APP_VERS} 
Running on Port ${process.env.APP_PORT}`));