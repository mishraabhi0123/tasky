const express = require('express');
const {Task, validateTask} = require('../models/tasks');
const auth = require('../middlewares/auth');
const _ = require('lodash');
const router = express.Router();

async function getTasksList(req, res) {
    const tasks = await Task.find().sort('_id');
    res.send(tasks);
}

async function deleteTask(req, res) {
    const task = await Task.findByIdAndRemove(req.params.id);
    if (!task) return res.status(400).send('Invalid task Id');
    res.send(task);
}

async function updateTask(req, res){
    const {error} = validateTask(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    let task = _.pick(req.body,['name', 'description', 'priority', 'status'])
    task = await Task.findByIdAndUpdate(req.params.id, task,{new :true});

    if (!task) return res.status(400).send('Invalid id.')
    res.send(task);
}

async function addTask(req, res) {
    const {error} = validateTask(req.body);
    if (error) return res.status(400).send(error.details[0].message);
    const task = new Task(_.pick(req.body,['name', 'description', 'status', 'priority']));
    task.userId = req.user._id;
    await task.save();
    res.send(task);
}

router.get('/', auth, getTasksList);
router.post('/', auth, addTask);
router.delete('/:id', auth, deleteTask);
router.put('/:id', auth, updateTask);

module.exports = router;