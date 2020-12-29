const jwt = require('jsonwebtoken');
const Joi = require('@hapi/joi');
const bcrypt = require('bcrypt');
const express = require('express');
const _ = require('lodash');
const {User,validateUser} = require('../models/users'); 
const config  = require('config');
const router = express.Router();

async function getuserslist(req, res) {
    const users = await User.find().sort('_id');
    res.send(users);
}

async function registerUser(req, res){

    const {error} = validateUser(req.body);
    if(error) return res.status(400).send(error.details[0].message);

    let user = await User.findOne({email : req.body.email});
    if (user) return res.status(400).send('User already registered.');

    user = new User(_.pick(req.body, ['name', 'email', 'password']));
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);

    const token = user.generateAuthToken();
    user.verificationToken = token;
    await user.save();

    let mailOptions = {
        from : "webapps1542@gmail.com",
        to : user.email,
        subject : "Email Verification",
        html : `<a href = ${'http://localhost:3000/api/users/' + token}>Verify</a>`
    };

    const info = await sendMail(mailOptions);
    console.log(info);

    return res.send(user);
}

async function login(req,res) {
    const schema = Joi.object().keys({
        email : Joi.string().required().min(3).max(256).email(),
        password : Joi.string().required().min(4).max(16)
    });
    const {error} = schema.validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const user = await User.findOne({email : req.body.email});
    if (!user) return res.status(400).send('Invalid email or password.');

    const validPassword = bcrypt.compare(req.body.password, user.password);
    if (!validPassword) return res.status(400).send('Invalid email or password.');

    const token = user.generateAuthToken();
    res.setHeader('x-auth-token',token);
    res.send('Login successful.');
}

async function verifyMail(req,res){
    const token = req.params.id;
    const decoded = jwt.verify(token, config.get('jwtPrivateKey'));
    const user = User.findByIdAndUpdate(decoded._id, {active : true});
    if ( !user ) return res.status(400).send('Invalid token.');
    res.send(`Email verification successful!`);
    console.log(`verify button clicked`);
}

router.get('/', getuserslist);
router.post('/', registerUser);
router.post('/login', login);
router.get('/:id', verifyMail);


module.exports = router;