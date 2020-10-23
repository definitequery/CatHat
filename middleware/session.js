/*
const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../database/database');
const saltRounds = 10;
const sessionRouter = express.Router();

function sessionChecker(request, response, next) {
    if (request.session.user && request.cookies.user_sid) {
        response.redirect('/courses');
    } else {
        next();
    }
}

function sessionizeUser(user) {
    return {
        first_name: user.first_name,
        last_name: user.last_name
    }
}

function insertUser(newUser) {
    bcrypt.genSalt(saltRounds, (error, salt) => {
        if (error) throw error;
        bcrypt.hash(newUser[4], salt, (error, hash) => {
            if (error) throw error;
            const query = `INSERT INTO "Users"(is_instructor, email, first_name, last_name, password_hash, password_salt, school) VALUES 
                ($1, $2, $3, $4, $5, $6, $7)`;
            newUser = [newUser[0], newUser[1], newUser[2], newUser[3], hash, salt, newUser[5]];
            db.query(query, newUser, (error, response) => {
                if (error) throw error;
            });
        });
    });
}

sessionRouter.get('/', sessionChecker, (request, response) => {
    console.log(request.session.user);
    response.render('index');
});
sessionRouter.get('/courses', (request, response) => {
    if (request.session.user && request.cookies.user_sid) {
        response.render('courses');
    } else {
        response.redirect('/signin');
    }
});
sessionRouter.get('/signup', (request, response) => {
    response.render('sign_up');
})
sessionRouter.post("/signup", (request, response) => {
    let { school_name, is_instructor, email, first_name, last_name, password } = request.body;
    is_instructor = parseInt(is_instructor, 10);
    email = email.toLowerCase();
    const newUser = [is_instructor, email, first_name, last_name, password, school_name];
    insertUser(newUser);
    const sessionUser = sessionizeUser({first_name, last_name});
    request.session.user = sessionUser;
    response.send(sessionUser);
});
sessionRouter.get('/signin', (request, response) => {
    response.render('sign_in');
});

module.exports = {
    router: sessionRouter
};
*/