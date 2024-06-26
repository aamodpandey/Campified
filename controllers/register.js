"use strict";
const nodemailer = require("nodemailer");
const jwt = require('jsonwebtoken')
module.exports = async function (id, email) {
    let transporter = nodemailer.createTransport({
        service: 'Gmail',
        secure:true,
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
            const url = `https://campified.onrender.com/confirmation/${emailToken}`;
            transporter.sendMail({
            from: `"Campified Admin" <${process.env.GMAIL_USER}@gmail.com>`,
            to: email,
            subject: "Confirm Email",
            html: `<p>Thank you for registering on Campified!<br>Click <a href='${url}'>here</a> to activate your account:<br></p>`,
            });
        },
    );
}

