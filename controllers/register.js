"use strict";
const nodemailer = require("nodemailer");
const jwt = require('jsonwebtoken')
module.exports = async function (id, email) {
    let transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_PASS,
        },
    });

    jwt.sign(
        {
            user: id,
        },
        process.env.EMAIL_SECRET,
        {
            expiresIn: '1d',
        },
        (err, emailToken) => {
            const url = `https://yelpcamp-aamod.onrender.com/confirmation/${emailToken}`;
            transporter.sendMail({
                from: '"YelpCamp Admin" <yelpcampauth@gmail.com>', // sender address
                to: email, // list of receivers
                subject: "Confirm Email",
                html: `<p>Thank you for registering on YelpCamp!<br>Click <a href='${url}'>here</a> to activate your account:<br></p>`,
            });

        },
    );
}

