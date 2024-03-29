require('dotenv').config({
    path: '.env'
});
require('express-async-errors');
const express = require('express');
const mongoose = require('mongoose');
const config = require('config');
const users = require('./routes/users');
const tasks = require('./routes/tasks');
const groups = require('./routes/groups');

const app = express();

if (!config.get('jwtPrivateKey') || !config.get('mailPassword')) {
    console.error("FATAL ERROR : One or more configuration variables not defined.");
    process.exit(1);
}

const dbString = process.env.NODE_ENV === "production" ? process.env.PROD_DB : process.env.DEV_DB;

console.log(dbString)
mongoose.connect(dbString, {
    useNewUrlParser : true,
    useUnifiedTopology : true, 
    useCreateIndex : true,
    useFindAndModify : false
})
    .then(() => console.log('Connected to tasky Database..'))
    .catch((err) => console.log('Could not connect to the database', err));

app.use(express.json());
app.use('/api/users', users);
app.use('/api/tasks', tasks);
app.use('/api/groups', groups);
app.get('/ping', (req, res) => res.send("Pong"));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}...`));