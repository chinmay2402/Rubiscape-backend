const mongoose = require("mongoose");
const Review = require("./models/Review"); 

const MONGO_URI = "mongodb+srv://chinmay24csk:Chinmay%40123@cluster0.sxunue2.mongodb.net/rubiProject";
const TEST_USER_ID = "661ba2c6b44a8c3d18e5e8e1"; // Generic test ID from seed or dummy

async function testLock() {
  try {
    await mongoose.connect(MONGO_URI);
    
    // Find a pending task
    const task = await Review.findOne({ "status.state": "pending" });
    if (!task) {
      console.log("No pending tasks found.");
      process.exit(0);
    }

    console.log(`Testing lock on task ${task._id}...`);
    
    // Simulate lockReview logic
    task.isLocked = true;
    task.lockedBy = new mongoose.Types.ObjectId(TEST_USER_ID);
    task.lockedAt = new Date();
    task.status.state = "under_review";
    task.status.updatedBy = "Test User";
    task.status.updatedAt = new Date();
    task.status.comment = "Simulated Lock";
    task.assignedTo = new mongoose.Types.ObjectId(TEST_USER_ID);

    await task.save();
    console.log("Task saved successfully.");

    const verified = await Review.findById(task._id);
    console.log("Verified State in DB:", verified.status.state);
    
    if (verified.status.state === "under_review") {
      console.log("SUCCESS: Mongoose correctly updated the state field.");
    } else {
      console.log("FAILURE: Mongoose did not persist the state change.");
    }

    process.exit(0);
  } catch (err) {
    console.error("Test failed:", err.message);
    process.exit(1);
  }
}

testLock();
