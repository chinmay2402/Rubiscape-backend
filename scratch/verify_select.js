const mongoose = require('mongoose');
const Review = require('../models/Review');
const User = require('../models/User');

async function test() {
    try {
        await mongoose.connect('mongodb+srv://chinmay24csk:Chinmay%40123@cluster0.sxunue2.mongodb.net/rubiProject'); 
        console.log('Connected');
        
        const reviewer = await User.findOne({ role: 'reviewer' });
        if (!reviewer) {
            console.log('No reviewer found');
            return;
        }
        
        const results = await Review.find({ assignedTo: reviewer._id }).select('aiPrompt status');
        console.log('Sample result:', JSON.stringify(results[0], null, 2));
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

test();
