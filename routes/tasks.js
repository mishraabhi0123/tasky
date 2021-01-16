const express = require('express');
const {Task, validateTask} = require('../models/tasks');
const auth = require('../middlewares/auth');
const checkAdmin = require('../middlewares/checkAdmin');
const _ = require('lodash');
const { Group } = require('../models/groups');
const router = express.Router();

async function getTasksList(req, res) {
    try {
        const groupId = req.params.groupId;
        const tasks = await Task.find({groupId : groupId}).sort('_id');
        res.send(tasks);
    }
    catch(ex){
        res.status(500).send('Internal server error.');
    }
}

async function addTask(req, res) {
    try {
        const {error} = validateTask(req.body);
        if (error) return res.status(400).send(error.details[0].message);
        const {name, description, status, priority} = req.body;
        let task = {name, description, status, priority};
        task = new Task(task);
        task.createdBy = req.user._id;
        task.groupId = req.params.groupId;
    
        await task.save();
        res.send(task);
    }
    catch(ex){
        res.status(500).send('Internal server error.');
    }
}

async function updateTask(req, res){
    try {
        const group = await Group.find({members : {$in : [req.user._id]}});
        if (!group) return res.status(403).send('You are not the member of the group. You cannot perform this action.');
    
        const {error} = validateTask(req.body);
        if (error) return res.status(400).send(error.details[0].message);
    
        const {name, description, status, priority} = req.body;
        let task = {name, description, status, priority};
        task = await Task.findByIdAndUpdate(req.params.taskId, task,{new :true});
    
        if (!task) return res.status(400).send('Invalid id.')
        res.send(task);
    }
    catch(ex){
        res.status(500).send('Internal server error.');
    }
}

async function deleteTask(req, res) {
    try {
        const task = await Task.findByIdAndRemove(req.params.taskId);
        if (!task) return res.status(400).send('Invalid task Id');
        res.send(task);
    }
    catch(ex){
        res.status(500).send('Internal server error.');
    }
}

router.get('/:groupId/bring_all_tasks', auth, getTasksList);
router.post('/:groupId/create_new_task', auth, checkAdmin, addTask);
router.put('/:groupId/:taskId/update_task', auth, updateTask);
router.delete('/:groupId/:taskId/delete_task', auth, checkAdmin, deleteTask);

module.exports = router;