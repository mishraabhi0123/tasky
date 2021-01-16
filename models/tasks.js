
const mongoose = require('mongoose');
const Joi = require('@hapi/joi');

const taskSchema = new mongoose.Schema({
    createdBy : {
        type : mongoose.Types.ObjectId,
        required : true
    },
    groupId : {
        type : mongoose.Types.ObjectId,
        required : true
    },
    name : {
        type : String,
        required : true,
        minlength : 3,
        maxlength : 1024
    },
    description : {
        type : String,
        minlength : 10,
        maxlength : 2048,
    },
    timeStamp : {
        type : Date,
        default : Date.now()
    },
    status : {
        type : String,
        enum : ['active', 'completed', 'deleted'],
        default : 'active'
    },
    priority : {
        type : Number,
        default : 0
    }
});

const Task = mongoose.model('Task', taskSchema);

function validateTask(task) {
    const schema = Joi.object().keys({
        name : Joi.string().required().min(3).max(1024),
        description : Joi.string().min(10).max(2048),
        priority : Joi.number().min(0).max(100),
        status : Joi.string().valid('active','completed','deleted')
    }); 

    return schema.validate(task);
}


module.exports.taskSchema = taskSchema;
module.exports.Task = Task;
module.exports.validateTask = validateTask;