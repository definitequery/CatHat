require('dotenv').config();
const ejs = require('ejs');
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

/* HTTP GET routes */
app.get('/create', (req, res) => {
    res.render('index', {page: 'Create'});
});
app.get('/u/:user_id', validateSession, (req, res) => res.send(`GETTING USER WITH USER ID ${req.params.user_id}`));

/* Completed Routes */
app.get('/', (req, res) => res.render('index', {page: 'Home'}));
app.get('/c/:join_code', validateSession, (req, res) => res.render('course', {join_code: req.params.join_code}));
app.get('/c', validateSession, (req, res) => res.render('index', {page: 'Courses', data: req.session.user}));
app.post('/c', (req, res) => {
    console.log(req.body);
    res.redirect('/c');
});
app.get('/signin', (req, res) => {
    if (req.session.user) {
        res.redirect('/c');
    }
    res.render('index', {page: 'Sign In', message: ""});
});
app.post('/signin', (req, res) => {
    const query = `SELECT * FROM "Users" U INNER JOIN "UserRoles" UR ON UR.user_id = U.user_id 
	    INNER JOIN "Roles" R ON R.role_id = UR.role_id WHERE email=$1`;
    database.query(query, [req.body.email], (error, results) => {
        if (error) throw error;
        bcrypt.compare(req.body.password, results.rows[0].password_hash, (error, result) => {
            if (error) throw error;
            if (result) {
                const user = {first_name: results.rows[0].first_name, last_name: 
                    results.rows[0].last_name, role: results.rows[0].name, school: results.rows[0].school};
                req.session.user = user;
                res.redirect('/c');
            } else {
                res.render('index', {page: 'Sign In', message: 'Error: Incorrect username or password!'});
            }
        });
    });
});
app.get('/signup', (req, res) => res.render('index', {page: 'Sign Up', message: ''}));
app.post('/signup', (req, res) => {
    if (req.body.password[0] !== req.body.password[1]) {
        res.render('index', {page: 'Sign Up', message: 'Error: Passwords must match!'});
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
        const newUser = {first_name: req.body.first_name, last_name: req.body.last_name,
            role: (req.body.role == 1) ? 'Student' : 'Instructor', school: req.body.school};
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