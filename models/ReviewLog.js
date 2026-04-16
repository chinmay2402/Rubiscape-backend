// models/ReviewLog.js
const mongoose = require("mongoose");

const logSchema = new mongoose.Schema({
  reviewId: mongoose.Schema.Types.ObjectId,
  action: String,
  comment: String,
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  role: String,
  snapshot: {
    aiPrompt: String,
    aiOutput: String,
    status: Object
  }
}, { timestamps: true });

module.exports = mongoose.model("ReviewLog", logSchema);