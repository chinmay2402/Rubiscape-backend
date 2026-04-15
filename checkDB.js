require("dotenv").config();
const mongoose = require("mongoose");
const Review = require("./models/Review"); 

const MONGO_URI = process.env.MONGO_URI;

async function check() {
  try {
    await mongoose.connect(MONGO_URI);
    const tasks = await Review.find({});
    console.log("Tasks in DB:", JSON.stringify(tasks, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
