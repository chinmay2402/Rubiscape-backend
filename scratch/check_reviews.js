const mongoose = require('mongoose');
const Review = require('../models/Review');

async function test() {
    try {
        await mongoose.connect('mongodb+srv://chinmay24csk:Chinmay%40123@cluster0.sxunue2.mongodb.net/rubiProject'); 
        console.log('Connected');
        
        const counts = await Review.aggregate([
            {
                $group: {
                    _id: "$status.state",
                    count: { $sum: 1 }
                }
            }
        ]);
        console.log('States in DB:', JSON.stringify(counts, null, 2));

        const sampleUnderReview = await Review.findOne({ "status.state": "under_review" });
        console.log('Sample Under Review:', JSON.stringify(sampleUnderReview, null, 2));
        
        const samplePending = await Review.findOne({ "status.state": "pending" });
        console.log('Sample Pending:', JSON.stringify(samplePending, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

test();
