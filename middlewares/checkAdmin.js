const {Group} = require('../models/groups');
const {User} = require('../models/users');

module.exports = async function checkAdmin(req, res, next) {
    const userId = req.user._id;
    const groupId = req.params.groupId;
    let isAdmin = false;
    
    const group = await Group.findById(groupId);
    if (!group) return res.status(400).send('checkAdmin says -> Invalid group Id.');
    
    const user = await User.findById(userId);
    if (!user) return res.status(400).send('Your Id is invalid. Please check and retry.');

    for (let index = 0; index < group.admins.length; index++) {
        if (userId == group.admins[index]) {
            isAdmin = true;
            req.groupId = groupId;
            break;
        }
    }

    if (isAdmin) next();
    else return res.status(401).send('Action not permitted. You are not an admin.');
}