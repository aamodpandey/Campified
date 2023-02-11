const User = require('../models/user');
const jwt = require('jsonwebtoken')
const Register = require('./register')
const {UserExistsError} = require("passport-local-mongoose/lib/errors");
module.exports.renderRegister = (req, res) => {
    res.render('users/register');
}
const registerErrorHandler = (e, req) => {
    if (e.code === 11000) req.flash('error', 'Username or email already exists, try another');
}
module.exports.register = async (req, res) => {
    try {
        const {email, username} = req.body;
        const user = new User({email, username});
        await user.save();
        Register(user._id, email);
        res.render('users/emailSent')
    } catch (e) {
        registerErrorHandler(e, req)
        res.redirect('register');
    }
}

module.exports.confirmEmail = async (req, res) => {
    try {
        const response = jwt.verify(req.params.token, process.env.EMAIL_SECRET)
        const user = await User.findById(response.user)
        req.session.username = user.username;
        res.render('users/submitPassword', {user})
    } catch (e) {
        res.flash('error', 'Error in confirming email')
    }

}

module.exports.uponSubmitting = async (req, res) => {
    try {
        const user = await User.findOne({username: req.session.username});
        delete req.session.username;
        const {username, email} = user;
        await user.remove();
        const newUser = new User({email, username, confirmed: true})
        const registeredUser = await User.register(newUser, req.body.password);
        req.login(registeredUser, err => {
            if (err) return next(err);
            req.flash('success', 'Welcome to Yelp Camp!');
            res.redirect('/campgrounds');
        })
    } catch (e) {
        req.flash('error', 'Error in submitting!')
    }
}

module.exports.renderLogin = (req, res) => {
    res.render('users/login');
}

module.exports.login = (req, res) => {
    req.flash('success', 'welcome back!');
    const redirectUrl = req.session.returnTo || '/campgrounds';
    delete req.session.returnTo;
    res.redirect(redirectUrl);
}

module.exports.logout = (req, res) => {
    req.logout((err) => {
        if (err) return next(err);
        req.flash('success', "Goodbye!");
        res.redirect('/campgrounds');
    });

}