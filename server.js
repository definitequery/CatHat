require('dotenv').config();
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const database = require('./database/database');
const appLogger = require('./middleware/logger');
const validateSession = require('./middleware/validate');
const express = require('express');
const session = require('express-session');
const connectPG = require('connect-pg-simple')(session);
const uuid = require('uuid');
const bcrypt = require('bcrypt')
const fs = require('fs');
const showdown = require('showdown');
const fetch = require('node-fetch');
app = express();

const saltRounds = 10;
app.use(express.static('static'));
app.set('view engine', 'ejs');

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.use(session({
    genid: (req) => { return uuid.v4() },
    store: new connectPG({
        pool: database,
        tableName: "UserSessions"
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {httpOnly: true, maxAge: 60000}
}))
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(appLogger);

/* Completed Routes */
app.get('/', (req, res) => res.render('index', {page: 'Home'}));
app.get('/c/:join_code/p', validateSession, (req, res) => {
    let query = `SELECT * FROM "Courses" C WHERE C.join_code = $1`;
    database.query(query, [req.params.join_code], (error, results) => {
        if (error) throw error;
        const data = results.rows[0];
        if (req.session.user.role === "Instructor") {
            query = `SELECT * FROM "SurveyResults" WHERE course_id = $1`
            database.query(query, [data.course_id], (error, results) => {
                if (error) throw error;
                res.render('index', {page: 'Course', user: req.session.user, data: data, markdown: false, attendance: [false, 0],
                    message: req.session.message, poll: true, poll_results: results.rows[0]});
            });
        } else if (req.session.user.role === 'Student') {
            res.render('index', {page: 'Course', user: req.session.user, data: data, markdown: false, attendance: [false, 0],
                message: req.session.message, poll: true, poll_results: {}});
        }
    });
});
app.post('/c/:join_code/p', validateSession, (req, res) => {
    let query = `SELECT * FROM "Courses" C WHERE C.join_code = $1`;
    database.query(query, [req.params.join_code], (error, results) => {
        if (error) throw error;
        const data = results.rows[0];
        query = `INSERT INTO "SurveyResults" (answer_1, answer_2, answer_3, course_id) 
            VALUES ($1, $2, $3, $4)
            ON CONFLICT ON CONSTRAINT course
            DO UPDATE SET 
                answer_1 = excluded.answer_1 + "SurveyResults".answer_1,
                answer_2 = excluded.answer_2 + "SurveyResults".answer_2,
                answer_3 = excluded.answer_3 + "SurveyResults".answer_3;`
        if (req.body.answer === 'Sucker Punch') {
            let answer_1 = 1;
            let answer_2 = 0;
            let answer_3 = 0;
            database.query(query, [answer_1, answer_2, answer_3, data.course_id], (error, results) => {
                if (error) throw error;
            }); 
        } else if (req.body.answer === 'The Avengers') {
            let answer_1 = 0;
            let answer_2 = 1;
            let answer_3 = 0;
            database.query(query, [answer_1, answer_2, answer_3, data.course_id], (error, results) => {
                if (error) throw error;
            }); 
        } else if (req.body.answer === 'Batman: The Dark Knight') {
            let answer_1 = 0;
            let answer_2 = 0;
            let answer_3 = 1;
            database.query(query, [answer_1, answer_2, answer_3, data.course_id], (error, results) => {
                if (error) throw error;
            });
        }
    });
    res.redirect(`/c/${req.params.join_code}/`);
});
app.get('/c/:join_code/a', validateSession, (req, res) => {
    let query = `SELECT * FROM "Courses" C WHERE C.join_code = $1`;
    let a_code = 0;
    database.query(query, [req.params.join_code], (error, results) => {
        if (error) throw error;
        const data = results.rows[0];
        if (req.session.user.role == "Instructor") {
            a_code = Math.floor(100000 + Math.random() * 900000);
            query = `INSERT INTO "CourseAttendance" (course_id, attendance_code) 
            VALUES ($1, $2)
            ON CONFLICT ON CONSTRAINT course_id
            DO UPDATE SET 
                course_id = excluded.course_id, 
                attendance_code = excluded.attendance_code;`;
            database.query(query, [data.course_id, a_code], (error, results) => {
                if (error) throw error;
            });
        }
        res.render('index', {page: 'Course', user: req.session.user, data: data, markdown: false, attendance: [true, a_code],
            message: req.session.message, poll: false});
    });
});
app.post('/c/:join_code/a', validateSession, (req, res) => {
    const query = `INSERT INTO "Attendance" (user_id, course_id, is_present, date)
        SELECT U.user_id, C.course_id, 1, $4 FROM "Courses" C CROSS JOIN "Users" U
            INNER JOIN "CourseAttendance" CA ON C.course_id = CA.course_id WHERE C.join_code = $1
            AND CA.attendance_code = $2 AND U.email = $3`;
    database.query(query, [req.params.join_code, req.body.attendance_code, req.session.user.email, new Date()], (error, results) => {
        if (error) throw error;
        if (results.rowCount === 0) {
            req.session.message = "Error: Invalid attendance code";
            res.redirect(`/c/${req.params.join_code}/a`);
        } else if (results.rowCount === 1) {
            res.redirect('/c');
        }
    });
});
app.get('/c/:join_code/m', validateSession, (req, res) => {
    fs.readFile('./markdown/test.md', 'utf8', (error, data) => {
        if (error) throw error;
        var converter = new showdown.Converter();
        var html = converter.makeHtml(data);
        fs.writeFile('./views/markdown.ejs', html, (error) => {
            if (error) throw error;
            console.log("File saved successfully");
        });
    });
    const query = `SELECT * FROM "Courses" C WHERE C.join_code = $1`;
    database.query(query, [req.params.join_code], (error, results) => {
        if (error) throw error;
        res.render('index', {page:'Course', user: req.session.user, data: results.rows[0], markdown: true,
            attendance: [false, 0], message: "", poll: false});
    });
});
app.get('/c/:join_code', validateSession, (req, res) => {
    const query = `SELECT * FROM "Courses" C WHERE C.join_code = $1`;
    database.query(query, [req.params.join_code], (error, results) => {
        if (error) throw error;
        res.render('index', {page:'Course', user: req.session.user, data: results.rows[0], markdown: false,  attendance: [false, 0], 
            message: "", poll: false});
    });
});
app.get('/c', validateSession, (req, res) => {
    const query = `SELECT * FROM "Users" U INNER JOIN "CourseUsers" CU ON CU.user_id = U.user_id
        INNER JOIN "Courses" C ON C.course_id = CU.course_id WHERE email=$1`;
    database.query(query, [req.session.user.email], (error, results) => {
        if (error) throw error;
        res.render('index', {page: 'Courses', user: req.session.user, data: results.rows});
    });
});
app.post('/j')
app.post('/c', (req, res) => {
    if (req.session.user.role === 'Instructor') {
        query = `INSERT INTO "Courses"(course_name, start_date, subject, course_code, description, join_code) 
        VALUES ($1, $2, $3, $4, $5, $6)`;
        const join_code = Math.floor(100000 + Math.random() * 900000);
        parameters = [req.body.course_name, req.body.start_date, req.body.subject, 
            req.body.course_code, req.body.course_description, join_code];
        database.query(query, parameters, (error, results) => {
            if (error) throw error;
            query = `INSERT INTO "CourseUsers"(course_id, user_id)
                SELECT course_id, user_id 
                FROM "Courses" C CROSS JOIN "Users" U WHERE C.join_code = $1 AND U.email = $2`;
            database.query(query, [join_code, req.session.user.email], (error, result) => {
                if (error) throw error;            
            });
        });
    } else {
        query = `INSERT INTO "CourseUsers"(course_id, user_id)
        SELECT course_id, user_id 
        FROM "Courses" C CROSS JOIN "Users" U WHERE C.join_code = $1 AND U.email = $2`;
        database.query(query, [req.body.join_code, req.session.user.email], (error, result) => {
            if (error) throw error;            
        });
    }
    res.redirect('/c');
});
app.get('/signin', (req, res) => {
    if (req.session.user) {
        res.redirect('/c');
    } else {
        res.render('index', {page: 'Sign In', message: req.session.message});
    }
});
app.post('/signin', (req, res) => {
    const query = `SELECT * FROM "Users" U INNER JOIN "UserRoles" UR ON UR.user_id = U.user_id 
	    INNER JOIN "Roles" R ON R.role_id = UR.role_id WHERE email=$1`;
    database.query(query, [req.body.email], (error, results) => {
        if (error) throw error
        if (results.rows[0] !== undefined) {
            bcrypt.compare(req.body.password, results.rows[0].password_hash, (error, result) => {
                if (error) throw error;
                if (result) {
                    const user = {email: results.rows[0].email, first_name: results.rows[0].first_name, last_name: 
                        results.rows[0].last_name, role: results.rows[0].name, school: results.rows[0].school};
                    req.session.user = user;
                    res.redirect('/c');
                } else {
                    req.session.message = "Error: Incorrect username or password";
                    res.redirect('/signin');
                }
            });
        } else {
            req.session.message = "Error: Incorrect username or password";
            res.redirect('signin');
        }
    });
});
app.get('/signup', (req, res) => res.render('index', {page: 'Sign Up', message: req.session.message}));
app.post('/signup', (req, res) => {
    if (req.body.password[0] !== req.body.password[1]) {
        req.session.message = "Error: Passwords must match";
        res.redirect('/signup');
    }
    else {
        var query = `INSERT INTO "Users"(first_name, last_name, email, password_hash, 
            password_salt, school) VALUES ($1, $2, $3, $4, $5, $6)`;
        bcrypt.genSalt(saltRounds, (error, salt) => {
            if (error) throw error;
            bcrypt.hash(req.body.password[0], salt, (error, hash) => {
                if (error) throw error;
                const parameters = [req.body.first_name, req.body.last_name, 
                    req.body.email, hash, salt, req.body.school];
                database.query(query, parameters, (error, result) => {
                    if (error) throw error;
                    query = `INSERT INTO "UserRoles"(user_id, role_id)
                        SELECT user_id, $1 FROM "Users" WHERE email=$2`;
                    database.query(query, [req.body.role, req.body.email], (error, result) => {
                        if (error) throw error;            
                    })
                });
            });
        });
        const newUser = {email: req.body.email, first_name: req.body.first_name, last_name: req.body.last_name,
            role: (req.body.role == 2) ? 'Student' : 'Instructor', school: req.body.school};
        req.session.user = newUser;
        res.redirect('/c');
    }
});
app.get('/signout', validateSession, function(req, res){
    req.session.destroy(function(){
        res.end();
    });
    res.redirect('/signin');
});
 
app.listen(process.env.APP_PORT || 8080, () => console.log(`${process.env.APP_NAME} v${process.env.APP_VERS} 
Running on Port ${process.env.APP_PORT}`));