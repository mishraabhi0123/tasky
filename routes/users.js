const jwt = require('jsonwebtoken');
const Joi = require('@hapi/joi');
const bcrypt = require('bcryptjs');
const express = require('express');
const _ = require('lodash');
const config = require('config');
const {User,validateUser} = require('../models/users'); 
const {sendEmailVerificationMail} = require('../utils/email');
const { Group } = require('../models/groups');
const auth = require('../middlewares/auth');
const router = express.Router();

async function getuserslist(req, res) {
    try {
        const users = await User.find().sort('_id');
        res.send(users);
    }
    catch(ex){
        res.status(500).send('Internal server error.')
    }
}

async function registerUser(req, res){
    try {
        const {error} = validateUser(req.body);
        if(error) return res.status(400).send(error.details[0].message);

        let user = await User.findOne({email : req.body.email});
        if (user) return res.status(400).send('User already registered.');

        user = new User(_.pick(req.body, ['name', 'email', 'password']));
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);

        const personalGroup = new Group({
            name : user.name,
            createdBy : user._id,
            members : [user._id],
            admins : [user._id],
            isPersonal : true
        })

        const token = user.generateAuthToken();
        user.verificationToken = token;
        user.spaceId = personalGroup._id;

        await user.save();
        await personalGroup.save();

        const message = await sendEmailVerificationMail(user.email, token);
        console.log(message);
        return res.send(user);
    }
    catch(ex){
        console.log(ex);
        res.status(500).send('Internal server error.')
    }
}

async function login(req,res) {
    try {
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
    catch(ex){
        console.log(ex);
        res.status(500).send('Internal server error.')
    }
}

async function verifyEmail(req,res){
    try {
        const {token} = req.params;
        const decoded = jwt.verify(token, config.get('jwtPrivateKey'));
        try {
            var user = await User.findByIdAndUpdate(decoded._id, {active : true},{new : 1});
            if ( !user ) return res.status(400).send('Invalid token.');
        }
        catch (ex){
            return res.status(404).send('payload changed. Id does not exist.');
        }
        res.send(`Email verification successful!`);
    }
    catch(ex){
        console.log(ex);
        res.status(500).send('Internal server error.')
    }
}

async function sendVerificationMail(req, res) {
    try {
        const user = await User.findById(req.params.id);
        if(!user) return res.status(404).send('Invalid user Id');
        const token = user.generateAuthToken();
        const message = await sendEmailVerificationMail(user.email, token);
        res.send(message);
    }
    catch(ex){
        console.log(ex);
        res.status(500).send('Internal server error.')
    }
}

router.get('/get_all_users', getuserslist);
router.post('/newuser', registerUser);
router.post('/login', login);
router.get('/:token/verify_email', verifyEmail);
router.get('/:id/send_verification_email', sendVerificationMail)

module.exports = router;