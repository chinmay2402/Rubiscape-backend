const mongoose = require('mongoose');
const Review = require('../models/Review');
const User = require('../models/User');

async function test() {
    try {
        await mongoose.connect('mongodb+srv://chinmay24csk:Chinmay%40123@cluster0.sxunue2.mongodb.net/rubiProject'); 
        console.log('Connected');
        
        const reviewers = await User.find({ role: 'reviewer' });
        const reviewerIds = reviewers.map(r => r._id.toString());
        
        console.log('Valid Reviewer IDs:', reviewerIds);

        // Find tasks assigned to non-existent IDs
        const orphanedTasks = await Review.find({ 
            assignedTo: { $ne: null, $nin: reviewerIds }
        });

        console.log(`Found ${orphanedTasks.length} orphaned tasks.`);

        if (orphanedTasks.length > 0) {
            const res = await Review.updateMany(
                { assignedTo: { $ne: null, $nin: reviewerIds } },
                { 
                    assignedTo: null, 
                    isLocked: false, 
                    lockedBy: null, 
                    lockedAt: null,
                    "status.state": "pending",
                    "status.comment": "Reset by system cleanup (orphaned assignment)"
                }
            );
            console.log('Update result:', res);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

test();
