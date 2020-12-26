const Joi = require('@hapi/joi');
const bcrypt = require('bcrypt');
const express = require('express');
const _ = require('lodash');
const {User,validateUser} = require('../models/users'); 
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

router.get('/', getuserslist);
router.post('/', registerUser);
router.post('/login', login);


module.exports = router;