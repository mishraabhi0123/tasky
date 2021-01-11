const nodemailer = require('nodemailer');
const config  = require('config');
const password = config.get('mailPassword');

let transporter = nodemailer.createTransport({
    service : 'gmail',
    auth : {
        user : 'webapps1542@gmail.com',
        pass :  password
    }
});

async function sendEmail(mailOptions){
    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) reject(error);
            else resolve("Email sent successfully.");
        });
    });
}

module.exports.sendEmail = sendEmail;