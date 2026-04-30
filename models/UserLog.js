const mongoose = require("mongoose");

const userLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  userName: String,
  userEmail: String,
  action: {
    type: String,
    enum: ["login", "logout"],
    required: true
  },
  ipAddress: String,
  userAgent: String
}, { timestamps: true });

module.exports = mongoose.model("UserLog", userLogSchema);
