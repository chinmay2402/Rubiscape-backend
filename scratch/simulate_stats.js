const mongoose = require('mongoose');
const Review = require('../models/Review');
const User = require('../models/User');

async function test() {
    try {
        await mongoose.connect('mongodb+srv://chinmay24csk:Chinmay%40123@cluster0.sxunue2.mongodb.net/rubiProject'); 
        console.log('Connected');
        
        const reviewers = await User.find({ role: "reviewer" });

        const stats = await Review.aggregate([
          {
            $group: {
              _id: "$assignedTo",
              approved: {
                $sum: { $cond: [{ $eq: ["$status.state", "approved"] }, 1, 0] }
              },
              rejected: {
                $sum: { $cond: [{ $eq: ["$status.state", "rejected"] }, 1, 0] }
              },
              pending: {
                $sum: { $cond: [{ $eq: ["$status.state", "pending"] }, 1, 0] }
              },
              under_review: {
                $sum: { $cond: [{ $eq: ["$status.state", "under_review"] }, 1, 0] }
              }
            }
          }
        ]);

        console.log('Raw Stats from Aggregation:', JSON.stringify(stats, null, 2));

        const result = reviewers.map((reviewer) => {
          const stat = stats.find(
            (s) => s._id?.toString() === reviewer._id.toString()
          );

          return {
            reviewerId: reviewer._id,
            name: reviewer.name,
            approved: stat?.approved || 0,
            rejected: stat?.rejected || 0,
            pending: stat?.pending || 0,
            under_review: stat?.under_review || 0,
            total: (stat?.approved || 0) + (stat?.rejected || 0) + (stat?.pending || 0) + (stat?.under_review || 0)
          };
        });

        console.log('Final Processed Result:', JSON.stringify(result, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

test();
