const mongoose = require('mongoose');
const Review = require('../models/Review');

async function test() {
    try {
        await mongoose.connect('mongodb+srv://chinmay24csk:Chinmay%40123@cluster0.sxunue2.mongodb.net/rubiProject'); 
        console.log('Connected');
        
        const reviewerId = "69df73d03844b39c28c7ef21"; // tejas reviewer
        
        const approved = await Review.find({
          assignedTo: reviewerId,
          "status.state": "approved"
        }).select("aiPrompt aiOutput status");

        console.log('APPROVED COUNT:', approved.length);
        if (approved.length > 0) {
            console.log('FIRST ITEM STATUS:', JSON.stringify(approved[0].status, null, 2));
            console.log('FIRST ITEM STATE:', approved[0].status.state);
            console.log('FIRST ITEM TO_OBJECT:', JSON.stringify(approved[0].toObject(), null, 2));
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

test();
