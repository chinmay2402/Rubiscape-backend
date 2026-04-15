const mongoose = require("mongoose");
const Review = require("./models/Review"); 

const MONGO_URI = "mongodb+srv://chinmay24csk:Chinmay%40123@cluster0.sxunue2.mongodb.net/rubiProject";

async function verify() {
  try {
    await mongoose.connect(MONGO_URI);
    const all = await Review.find({});
    
    console.log("--- DETAILED STATUS DUMP ---");
    all.forEach(t => {
      console.log(`ID: ${t._id} | State: ${t.status?.state} | Type: ${t.status?.type} | comment: ${t.status?.comment}`);
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

verify();
