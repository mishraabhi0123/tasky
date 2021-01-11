const express = require('express');
const auth = require('../middlewares/auth');
const {Group, validateGroup} = require('../models/groups');
const {User} = require('../models/users');
const checkAdmin = require('../middlewares/checkAdmin');
const { sendEmail } = require('../utils/sendmail');
const _ = require('lodash');
const Fawn = require('fawn');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const config = require('config');
const router = express.Router();
Fawn.init(mongoose)


async function createNewGroup(req, res) {
    const createrId = req.user._id;
    console.log(createrId);
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

async function addUserToGroup(req,res){
    const userId = req.params.userId;
    const groupId = req.params.groupId;

    const user = await User.findById(userId);
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

        html : `<a href = ${`http://localhost:3000/api/groups/${groupId}`}> View Group Info </a>
                <hr>
                <a href= ${`http://localhost:3000/api/groups/accept/${groupId}/${token}`}> Accept </a>`
    }

    const info = await sendEmail(mailOptions);
    console.log(info);
    res.send('Invitation sent to the user.');
}

async function makeGroupAdmin(req, res){
    const userId = req.params.userId;
    const groupId = req.params.groupId;

    const user = await User.findById(userId);
    if (!user) return res.status(404).send('Invalid user Id');

    const group = await Group.findByIdAndUpdate(groupId, {
        $push : {admins : userId}
    },{new : 1});
    if (!group) return res.status(404).send('Invalid group Id');
    res.send(`${user.name} is now an Admin`);
}

async function viewGroupInfo(req,res){
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).send('Group with the given id not found.')

    const member_names = await User.find(
        {
            groupIds : {$in : [req.params.id]}
        })
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
};


async function acceptInvitation(req,res) {
    const groupId = req.params.groupId;
    const token = req.params.token;

    const decoded = jwt.verify(token, config.get('jwtPrivateKey'));

    // try {
    //     new Fawn.Task()
    //     .update('groups', {_id : groupId}, {
    //         $push : {members : decoded._id} 
    //     })
    //     .update('users', {_id : decoded._id}, {
    //         $push : {members : groupId} 
    //     })
    //     .run();
    //     res.send(`You are successfully added to ${group.name}.`)
    // }
    // catch (ex){
    //     res.status(500).send('Something failed.');
    // } 

    const group = await Group.findByIdAndUpdate(groupId, {
        $push : {members : decoded._id}
    });

    if (!group) return res.status(400).send('Group with the given id does not exist.');
    const user = await User.findByIdAndUpdate(decoded._id, {
        $push : {groupIds : groupId}
    });

    res.send(`You are now a member of the ${group.name}`);
    console.log(`${user.name} accepted the invitation.`);
}

async function exitGroup(req, res){
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
    const user = await User.findById(userId) 
    if (!user) return res.status(400).send('exitGroup says -> Your id is invalid please check.');
    _.remove(user.groupIds, (e) => {
        return e == group._id;
    });
    await user.save();  
    console.log(user);
    res.send(user);
}

async function deleteGroupById(req, res) {
    const groupId  = req.params.groupId;
    const group = await Group.findById(groupId);
    try {
        new Fawn.Task()
        .update('users', {_id : {$in : group.members}},
            {
                $pull : { groupIds : {$in : [groupId]}}
            }, {multi : true})
        // .remove('groups', {_id : groupId})
        .run();

        res.send('Group successfully deleted.');
    }
    catch (ex){
        res.send('Something went wrong.');
    }      
}

router.post('/newgroup', auth, createNewGroup);
router.get('/add/:groupId/:userId', auth, checkAdmin, addUserToGroup);
router.get('/admin/:groupId/:userId', auth, checkAdmin, makeGroupAdmin);
router.get('/:id', viewGroupInfo);
router.get('/accept/:groupId/:token', acceptInvitation);
router.delete('/:groupId', auth, checkAdmin, deleteGroupById);
router.get('/exit/:groupId',auth, exitGroup);


module.exports = router;