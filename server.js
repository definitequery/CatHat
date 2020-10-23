require('dotenv').config();
const mustacheExpress = require('mustache-express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const appLogger = require('./middleware/logger');
const express = require('express');
const session = require('express-session');
const uuid = require('uuid');
const pgSession = require('connect-pg-simple')(session);
const db = require('./database/database');
const bcrypt = require('bcrypt');
const saltRounds = 10;
app = express();

app.engine('html', mustacheExpress());
app.set('view engine', 'html');
app.set('views', __dirname + '/views')

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(appLogger);
app.use(session({
    genid: (req) => uuid.v4(),
    store: new pgSession({
        pool: db,
        tableName: "UserSessions"
    }),
    cookie: { maxAge: 60000 },
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
}))

app.get('/', (req, res) => {
    if (req.session.loggedin) {
        res.render('courses', {firstName: req.session.first_name, lastName: req.session.last_name, instructor: req.session.is_instructor});
    } else {
        res.render('index');
    }
});
app.get('/signup', (req, res) => res.render('sign_up'));
app.post('/signup', (req, res) => {
    const query = `INSERT INTO "Users"(school_name, first_name, last_name, email, password_hash, password_salt, is_instructor)
        VALUES ($1, $2, $3, $4, $5, $6, $7)`;
    bcrypt.genSalt(saltRounds, (error, salt) => {
        if (error) throw error;
        bcrypt.hash(req.body.password, salt, (error, hash) => {
            if (error) throw error;
            const newUser = [req.body.school_name, req.body.first_name, req.body.last_name, 
                req.body.email, hash, salt, req.body.is_instructor];
            db.query(query, newUser, (error, result) => {
                if (error) throw error;
                req.session.loggedin = true;
                req.session.first_name = req.body.first_name;
                req.session.last_name = req.body.last_name;
                res.render('courses', {firstName: req.session.first_name, lastName: req.session.last_name, instructor: req.session.is_instructor});
            });
        });
    });
});
app.get('/signin', (req, res) => res.render('sign_in'));
app.post('/signin', (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const query = `SELECT * FROM "Users" WHERE email=$1`;
    if (email && password) {
        db.query(query, [email], (error, results) => {
            if (results) {
                bcrypt.compare(password, results.rows[0].password_hash, (error, result) => {
                    if (result) {
                        req.session.loggedin = true;
                        req.session.first_name = results.rows[0].first_name;
                        req.session.last_name = results.rows[0].last_name;
                        req.session.is_instructor = results.rows[0].is_instructor;
                        res.render('courses', {firstName: req.session.first_name, lastName: req.session.last_name, instructor: req.session.is_instructor});
                    } else {
                        res.render('sign_in', {error: true});
                    }
                });
            } else {
                res.render('sign_in', {error: true});
            }
        });
    } else {
        res.render('sign_in', {error: true});
    }
});
app.get('/courses', (req, res) => {
    if (req.session.loggedin) {
        res.render('courses', {firstName: req.session.first_name, lastName: req.session.last_name, instructor: req.session.is_instructor});
    } else {
        res.redirect('/signin');
    }
});
app.post('/courses', (req, res) => {
    if (req.session.instructor) {
        const query1 = `INSERT INTO "Courses" (department_abbr, course_name, course_number, semester, year, join_code))
            VALUES ($1, $2, $3, $4, $5, $6)`;
        const query2 = `INSERT INTO "Courses_Instructors" (instructor_id, course_id))
        VALUES ($1, $2)`;
        db.query(query1, newCourse, (error, result) => {
            if (error) throw error;
            console.log(result);
        });
    }
});
app.get('/signout', (req, res) => {
    if (req.session.loggedin) {
        req.session.destroy((error) => {
            if (error) throw error;
            res.redirect('/');
        });
    }
})

app.listen(process.env.APP_PORT || 8080, () => console.log(`${process.env.APP_NAME} v${process.env.APP_VERS} 
Running on Port ${process.env.APP_PORT}`));