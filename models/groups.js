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
        type : mongoose.Types.ObjectId,
        required : true,
    },
    members : {
        type : [ mongoose.Types.ObjectId ],
        required : true,
    },
    admins : {
        type : [ mongoose.Types.ObjectId ]
    },
    creationDate :{
        type : Date,
        default : Date.now()
    },
    isPersonal : {
        type : Boolean,
        default : false
    }
});

const Group = mongoose.model('Group', groupSchema);

function validateGroup(group){
    const schema = Joi.object().keys({
        name : Joi.string().min(3).max(256)
    });

    return schema.validate(group);
}


exports.groupSchema = groupSchema;
exports.validateGroup = validateGroup;
exports.Group = Group;