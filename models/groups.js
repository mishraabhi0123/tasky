const Joi = require('@hapi/joi');
const mongoose = require('mongoose');


const groupSchema = new mongoose.Schema({
    name : {
        type : String,
        minlength : 3,
        maxlength : 256,
        trim : true
    },
    createdBy : {
        type : mongoose.Schema.Types.ObjectId,
        required : true
    },
    members : {
        type : [ mongoose.Schema.Types.ObjectId ],
        required : true,
    },
    roles : {
        type : [ String ],
        required : true
    },
    creationDate :{
        type : Date,
        default : Date.now()
    }
});

const Group = mongoose.model('Group', groupSchema);

function validateGroup(group){
    const schema = Joi.object().keys({
        name : Joi.string().min(3).max(256),
        members : Joi.array().minlength(2).maxlength(100).required(),
        roles : Joi.array().minlength(2).maxlength(100).required()
    });

    return schema.validate(group);
}


exports.groupSchema = groupSchema;
exports.validateGroup = validateGroup;
exports.Group = Group;