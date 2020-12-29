const express = require('express');
const {Group, validateGroup} = require('../models/groups');

async function viewGroupInfo(req,res){

};

async function deleteGroupById(req, res) {
    const group = await Group.findByIdAndRemove(req.params.id);
    if(!group) return res.status(400).send('Group with the given id not found.');
    res.send(group);
}

async function AddUserToGroup(req,res){
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(400).send('Invalid group id.');
    
}
