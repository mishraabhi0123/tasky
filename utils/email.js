const nodemailer = require('nodemailer');
const config  = require('config');
const password = config.get('mailPassword');
const email = process.env.EMAIL;

let transporter = nodemailer.createTransport({
    service : 'gmail',
    auth : {
        user : email,
        pass :  password
    }
});

async function sendEmail(mailOptions){
    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) reject(error);
            else resolve(info);
        });
    });
}

async function sendEmailVerificationMail(email, token) {
    let link = 'http://localhost:3000/api/users/' + token + '/verify_email';
    
    let mailOptions = {
        from: config.get('email'),
        to: email,
        subject: "Email Verification",
        html: `<a href = ${link}>Verify</a>`
    };
    console.log(process.env.NODE_ENV);
    if(process.env.NODE_ENV !== 'production') {
        console.log(link);
    }
    let sent = false;
    await sendEmail(mailOptions)
    .then(() => sent = true);

    return new Promise((resolve, reject) => {
        if (sent === true) resolve('Verification email sent to the registered email Id.')
        else reject('Could not send verification email.');
    });
}

module.exports.sendEmail = sendEmail;
module.exports.sendEmailVerificationMail = sendEmailVerificationMail;