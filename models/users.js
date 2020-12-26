
const mongoose = require('mongoose');
const Joi = require('@hapi/joi');
const jwt = require('jsonwebtoken');
const config = require('config');

const userSchema = new mongoose.Schema({

    name : {
        type : String,
        required : true,
        minlength : 3,
        maxlength : 256,
        trim : true
    },
    email : {
        type : String,
        required : true,
        minlength : 3,
        maxlength : 256,
        trim : true,
        unique : true
    },
    password : {
        type : String,
        required : true,
        maxlength : 1024,
    },
    isAdmin : {
        type : Boolean,
        default : false
    },
    joiningDate : {
        type : Date,
        default : Date.now()
    }

});

userSchema.methods.generateAuthToken = function() {
    const token = jwt.sign({ _id : this._id, isAdmin : this.isAdmin}, config.get('jwtPrivateKey'));
    return token;
}

const User = mongoose.model('User', userSchema);

function validateUser(user) {

    const schema = Joi.object().keys({
        name : Joi.string().min(3).max(256).required(),
        email : Joi.string().min(3).max(256).required().email(),
        password : Joi.string().min(4).max(20).required(),
    })

    return schema.validate(user)
}



module.exports.userSchema = userSchema;
module.exports.User = User;
module.exports.validateUser = validateUser;