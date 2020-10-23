require('dotenv').config();
const mustacheExpress = require('mustache-express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const appLogger = require('./middleware/logger');
const bcrypt = require('bcrypt');
const express = require('express');
const session = require('express-session');
const pgStore = require('connect-pg-simple')(session);
const db = require('./database/database');
const uuid = require('uuid');
const saltRounds = 10;
app = express();

app.engine('html', mustacheExpress());
app.set('view engine', 'html');
app.set('views', __dirname + '/views')

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({
    genid: () => uuid.v4(),
    store: new pgStore({
        pool: db,
        tableName: 'UserSessions'
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true
}));
app.use(appLogger);

app.get('/', (req, res) => res.render('index'));
app.get('/signup', (req, res) => res.render('sign_up'));
app.post('/signup', (req, res, next) => {
    const query = `INSERT INTO "Users"(first_name, last_name, school, password_hash, password_salt, email, is_instructor) VALUES ($1, $2, $3, $4, $5, $6, $7)`;
    bcrypt.genSalt(saltRounds, (error, salt) => {
        if (error) throw error;
        bcrypt.hash(req.body.password, salt, (error, hash) => {
            const newUser = [req.body.first_name, req.body.last_name, req.body.school_name, hash, salt, req.body.email, req.body.is_instructor];
            if (error) throw error;
            db.query(query, newUser, (error, result) => {
                if (error) throw error;
                console.log(result);
            });
        });
    });
    res.redirect('/courses');
});
app.get('/signin', (req, res) => res.render('sign_in'));
app.post('/signin', (req, res, next) => console.log("BOOP"));
app.get('/courses', (req, res) => res.render('courses'));

app.listen(process.env.APP_PORT, () => console.log(`${process.env.APP_NAME} v${process.env.APP_VERS} 
Running on Port ${process.env.APP_PORT}`));