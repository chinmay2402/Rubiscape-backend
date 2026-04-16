const mongoose = require('mongoose');
const ReviewLog = require('../models/ReviewLog');
const User = require('../models/User');

async function test() {
    try {
        await mongoose.connect('mongodb+srv://chinmay24csk:Chinmay%40123@cluster0.sxunue2.mongodb.net/rubiProject'); 
        console.log('Connected');
        
        const logs = await ReviewLog.find().sort({ createdAt: -1 }).limit(5);
        console.log('Recent Logs:', JSON.stringify(logs, null, 2));
        
        const populated = await ReviewLog.find().sort({ createdAt: -1 }).limit(5)
            .populate('performedBy', 'name')
            .populate('assignedTo', 'name');
            
        console.log('Populated Logs:', JSON.stringify(populated, null, 2));
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

test();
