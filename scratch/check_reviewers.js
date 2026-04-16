const mongoose = require('mongoose');
const User = require('../models/User');

async function test() {
    try {
        await mongoose.connect('mongodb+srv://chinmay24csk:Chinmay%40123@cluster0.sxunue2.mongodb.net/rubiProject'); 
        console.log('Connected');
        
        const reviewers = await User.find({ role: 'reviewer' });
        console.log('Reviewers:', JSON.stringify(reviewers, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

test();
