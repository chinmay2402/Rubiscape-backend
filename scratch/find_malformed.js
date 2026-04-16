const mongoose = require('mongoose');
const Review = require('../models/Review');

async function test() {
    try {
        await mongoose.connect('mongodb+srv://chinmay24csk:Chinmay%40123@cluster0.sxunue2.mongodb.net/rubiProject'); 
        console.log('Connected');
        
        const nullStatus = await Review.find({ status: null }).countDocuments();
        const noState = await Review.find({ "status.state": { $exists: false } }).countDocuments();
        const literalPending = await Review.find({ status: "pending" }).countDocuments();

        console.log('Tasks with null status:', nullStatus);
        console.log('Tasks with no status.state:', noState);
        console.log('Tasks where status IS the string "pending":', literalPending);

        const mysteryTasks = await Review.find({ 
            "status.state": { $nin: ["approved", "rejected", "under_review", "pending"] } 
        }).limit(5);
        console.log('Mystery Status Tasks:', JSON.stringify(mysteryTasks, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

test();
