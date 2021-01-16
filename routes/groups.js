const express = require('express');
const auth = require('../middlewares/auth');
const {Group, validateGroup} = require('../models/groups');
const {User} = require('../models/users');
const checkAdmin = require('../middlewares/checkAdmin');
const { sendEmail } = require('../utils/email');
const _ = require('lodash');
const Fawn = require('fawn');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const config = require('config');
const router = express.Router();
Fawn.init(mongoose)


async function getAllGroups(req,res) {
    try{
        const groups = await Group.find().sort('_id');
        res.send(groups);
    }
    catch(ex){
        res.status(500).send('Internal server error.');
    }
}

async function createNewGroup(req, res) {
    try{
        const createrId = req.user._id;
        const { error } = validateGroup(req.body);
        if (error) return res.status(400).send(error.details[0].message);
    
        const group = new Group(_.pick(req.body, ['name']));
        group.createdBy = createrId;
        group.members.push(createrId);
        group.admins.push(createrId);
    
        const user = await User.findByIdAndUpdate(createrId, {
            $push : {groupIds : group._id}
        });
        if (!user) return res.status(400).send('Invalid user Id.')
        await group.save();
        res.send(group);
    }
    catch(ex){
        res.status(500).send('Internal server error.');
    }
}

async function inviteUserToGroup(req,res){
    try{
        const {groupId, guestId} = req.params;
    
        const user = await User.findById(guestId);
        if (!user) return res.status(404).send('Invalid user Id');
    
        const group = await Group.findById(groupId);
        if (!group) return res.status(404).send('Invalid group Id');
        
        const token = user.generateAuthToken();
        const mailOptions = {
            from : "webapps1542@gmail.com",
            to : user.email,
            subject : "Tasky Group Invite",
            text : `${req.user.name} created a tasky group and wants you to be a part of it.
                     You can click the link below to accept the invitation.`,
    
            html : `<a href = ${`http://localhost:3000/api/groups/${groupId}/view_group_info`}> View Group Info </a>
                    <hr>
                    <a href= ${`http://localhost:3000/api/groups/${groupId}/${token}/accept_invitation`}> Accept </a>`
        }
    
        const info = await sendEmail(mailOptions);
        // res.send(info);
        res.send('Invitation sent to the user.');
    }
    catch(ex){
        res.status(500).send('Internal server error.');
    }
}

async function acceptInvitation(req,res) {
    try{
        const {groupId, token} = req.params;
        const decoded = jwt.verify(token, config.get('jwtPrivateKey'));
        try {
            const group = await Group.findByIdAndUpdate(groupId, {$addToSet : {members : decoded._id}});
            if (!group) return res.status(400).send('Group with the given id does not exist.');
            res.send(`You are now a member of the ${group.name}`);
        }
        catch(ex){
            res.status(404).send('Invalid token.');
        }
    }
    catch(ex){
        res.status(500).send('Internal server error.');
    }
}

async function makeGroupAdmin(req, res){
    try{
        const {groupId, memberId} = req.params;
        const member = await User.findById(memberId);
        if (!member) return res.status(404).send('Invalid user Id');
    
        const group = await Group.findByIdAndUpdate(groupId, {
            $push : {admins : memberId}
        },{new : 1});
        if (!group) return res.status(404).send('Invalid group Id');
        res.send(`${member.name} is now an Admin`);
    }
    catch(ex){
        res.status(500).send('Internal server error.');
    }
}

async function viewGroupInfo(req,res){
    try{
        const group = await Group.findById(req.params.groupId);
        if (!group) return res.status(404).send('Group with the given id not found.')
    
        const member_names = await User.find({_id : {$in : group.members}})
            .select('-_id')
            .select('name');
    
        const group_info = {
            group_name : group.name,
            created_by : group.createdBy,
            members : member_names,
            admins : group.admins,
            date : group.creationDate 
        };
    
        res.send(group_info);
    }
    catch(ex){
        res.status(500).send('Internal server error.');
    }
};

async function exitGroup(req, res){
    try{
        const groupId  = req.params.groupId;
        const userId = req.user._id;
        let group = await Group.findById(groupId);
        if (!group) return res.status(400).send('exitGroup says -> Invalid group Id.');
        if (group.isPersonal == true) return res.status(400).send('You cannot leave your personal group.');

        _.remove(group.members, (e) => {
            return e == userId;
        });
        _.remove(group.admins, (e) => {
            return e == userId;
        });

        console.log(group);
        await group.save();
        res.send(group);
    }
    catch(ex){
        res.status(500).send('Internal server error.');
    }
}

async function deleteGroupById(req, res) {
    try{
        const groupId  = req.params.groupId;
        const group = await Group.findByIdAndRemove(groupId);
        if (!group) return res.status(404).send('Invalid group Id.')
        res.send('Group deleted successfully.')
    }
    catch(ex){
        res.status(500).send('Internal server error.');
    }   
}


router.get('/get_all_groups', getAllGroups);
router.post('/create_group', auth, createNewGroup);
router.get('/:groupId/:guestId/invite_user_to_group', auth, checkAdmin, inviteUserToGroup);
router.get('/:groupId/:memberId/make_group_admin', auth, checkAdmin, makeGroupAdmin);
router.get('/:groupId/view_group_info', viewGroupInfo);
router.get('/:groupId/exit_group',auth, exitGroup);
router.get('/:groupId/:token/accept_invitation', acceptInvitation);
router.delete('/:groupId/delete_group', auth, checkAdmin, deleteGroupById);

module.exports = router;