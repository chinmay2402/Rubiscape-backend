require("dotenv").config();
const mongoose = require("mongoose");
const Review = require("./models/Review"); 

const MONGO_URI = process.env.MONGO_URI;

async function verify() {
  try {
    await mongoose.connect(MONGO_URI);
    
    console.log("--- SYSTEMATIC DB CHECK ---");
    const all = await Review.find({});
    console.log(`Total tasks: ${all.length}`);
    
    const underReview = await Review.find({ "status.state": "under_review" });
    console.log(`Tasks with state 'under_review': ${underReview.length}`);
    
    if (underReview.length > 0) {
      console.log("Sample Active Task:", {
        id: underReview[0]._id,
        state: underReview[0].status.state,
        assignedTo: underReview[0].assignedTo,
        isLocked: underReview[0].isLocked,
        lockedBy: underReview[0].lockedBy
      });
    }

    const pending = await Review.find({ "status.state": "pending" });
    console.log(`Tasks with state 'pending': ${pending.length}`);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

verify();
