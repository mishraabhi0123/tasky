const nodemailer = require('nodemailer');
const password = config.get('mailPassword');


async function sendMail(mailOptions){
    let transporter = nodemailer.createTransport({
        service : 'gmail',
        auth : {
            user : 'webapps1542@gmail.com',
            pass :  password
        }
    });
    
    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) reject(error);
            else resolve(info.response);
        });
    });
}

module.exports.sendMail = sendMail;