"use strict";
const nodemailer = require("nodemailer");
const jwt = require('jsonwebtoken')
module.exports = async function (id, email) {
    let transporter = nodemailer.createTransport({
        service: 'Gmail',
        port:587,
        host: "smtp.gmail.com",
        secure:false,
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
        async(err, emailToken) => {
            const url = `https://attractive-slippers-moth.cyclic.app/confirmation/${emailToken}`;
            let info=await transporter.sendMail({
            from: '"YelpCamp Admin" <yelpcampauth@gmail.com>',
            to: email,
            subject: "Confirm Email",
            html: `<p>Thank you for registering on YelpCamp!<br>Click <a href='${url}'>here</a> to activate your account:<br></p>`,
            });
        },
    );
}

