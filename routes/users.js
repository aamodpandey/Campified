const express = require('express');
const router = express.Router();
const passport = require('passport');
const catchAsync = require('../utils/catchAsync');
const User = require('../models/user');
const users = require('../controllers/users');
const {checkConfirmed, checkLoggedIn} = require('../middleware')
router.route('/register')
    .get(checkLoggedIn, users.renderRegister)
    .post(catchAsync(users.register));

router.route('/confirmation/:token')
    .get(users.confirmEmail)

router.route('/submitPassword')
    .post(users.uponSubmitting)

router.route('/login')
    .get(checkLoggedIn, users.renderLogin)
    .post(checkConfirmed, passport.authenticate('local', {
        failureFlash: true,
        failureRedirect: '/login'
    }), users.login)

router.get('/logout', users.logout)

module.exports = router;