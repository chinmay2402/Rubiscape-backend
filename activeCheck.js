const mongoose = require("mongoose");
const Review = require("./models/Review"); 

const MONGO_URI = "mongodb+srv://chinmay24csk:Chinmay%40123@cluster0.sxunue2.mongodb.net/rubiProject";

async function verify() {
  try {
    await mongoose.connect(MONGO_URI);
    const tasks = await Review.find({ "status.state": "under_review" });
    
    console.log(`Found ${tasks.length} active tasks.`);
    tasks.forEach(t => {
      console.log(`ID: ${t._id} | assignedTo: ${t.assignedTo} | lockedBy: ${t.lockedBy} | isLocked: ${t.isLocked}`);
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

verify();
