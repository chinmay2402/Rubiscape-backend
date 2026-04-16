const mongoose = require('mongoose');
const Review = require('../models/Review');

async function test() {
    try {
        await mongoose.connect('mongodb+srv://chinmay24csk:Chinmay%40123@cluster0.sxunue2.mongodb.net/rubiProject'); 
        console.log('Connected');
        
        const reviewerId = "69de6329c30fca8b75b77bc5"; // Tejas Shastri
        
        const approved = await Review.find({ assignedTo: reviewerId, "status.state": "approved" }).select("status");
        const underReview = await Review.find({ assignedTo: reviewerId, "status.state": "under_review" }).select("status");

        console.log('Approved sample:', JSON.stringify(approved, null, 2));
        console.log('UnderReview sample:', JSON.stringify(underReview, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

test();
