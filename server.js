require('dotenv').config();
const mustacheExpress = require('mustache-express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const appLogger = require('./middleware/logger');
const express = require('express');
app = express();

app.engine('html', mustacheExpress());
app.set('view engine', 'html');
app.set('views', __dirname + '/views')

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(appLogger);

app.get('/', (req, res) => res.render('index'));
app.get('/signup', (req, res) => res.render('sign_up'));
app.post('/signup', (req, res) => res.send("POST REQUEST PLACEHOLDER - SIGN UP"));
app.get('/signin', (req, res) => res.render('sign_in'));
app.post('/signin', (req, res) => res.send("POST REQUEST PLACEHOLDER - SIGN IN"));
app.get('/courses', (req, res) => res.render('courses'));

app.listen(process.env.APP_PORT, () => console.log(`${process.env.APP_NAME} v${process.env.APP_VERS} 
Running on Port ${process.env.APP_PORT}`));