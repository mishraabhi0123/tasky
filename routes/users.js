const jwt = require('jsonwebtoken');
const Joi = require('@hapi/joi');
const bcrypt = require('bcrypt');
const express = require('express');
const _ = require('lodash');
const config = require('config');
const {User,validateUser} = require('../models/users'); 
const sendEmail = require('../utils/sendmail');
const { Group } = require('../models/groups');
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

    const personalGroup = new Group({
        name : "My Space",
        createdBy : user._id,
        members : [user.id],
        admins : [user.id],
        isPersonal : true
    })

    await personalGroup.save();
    // const token = user.generateAuthToken();
    // user.verificationToken = token;

    // let mailOptions = {
    //     from : "webapps1542@gmail.com",
    //     to : user.email,
    //     subject : "Email Verification",
    //     html : `<a href = ${'http://localhost:3000/api/users/' + token}>Verify</a>`
    // };

    // const info = await sendEmail(mailOptions);
    // console.log(info);

    await user.save();
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

async function verifyEmail(req,res){
    const token = req.params.id;
    const decoded = jwt.verify(token, config.get('jwtPrivateKey'));
    // console.log(decoded);
    const user = await User.findByIdAndUpdate(decoded._id, {active : true},{new : 1});
    if ( !user ) return res.status(400).send('Invalid token.');

    // res.send(`Email verification successful!`);
    res.send(_.pick(user, ['name','email','active','groupIds','_id']));
    // console.log(user);
}

router.get('/', getuserslist);
router.post('/', registerUser);
router.post('/login', login);
router.get('/:id', verifyEmail);


module.exports = router;