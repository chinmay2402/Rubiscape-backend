const mongoose = require("mongoose");
const Review = require("./models/Review"); 

const MONGO_URI = "mongodb+srv://chinmay24csk:Chinmay%40123@cluster0.sxunue2.mongodb.net/rubiProject";

async function seed() {
  try {
    console.log("Connecting to DB...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected.");

    // CLEAN UP OLD DATA (Optional, but recommended for clean test)
    console.log("Cleaning existing tasks...");
    await Review.deleteMany({});

    const tasks = [];
    for (let i = 1; i <= 20; i++) {
        tasks.push({
            aiPrompt: `Refined Task #${i}: Testing the new 'status.state' schema integrity.`,
            aiOutput: `This output is generated for testing purposes. State: pending. Collision Check: Passed. [Task ID: ${i}]`,
            status: {
                state: "pending",
                updatedAt: new Date(),
                comment: "Schema refactor seed"
            },
            assignedTo: null,
            isLocked: false,
            lockedBy: null
        });
    }

    console.log(`Inserting ${tasks.length} tasks...`);
    await Review.insertMany(tasks);
    console.log("Success! 20 refined tasks added.");

    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err.message);
    process.exit(1);
  }
}

seed();
