// models/ReviewLog.js
const mongoose = require("mongoose");

const logSchema = new mongoose.Schema({
  reviewId: mongoose.Schema.Types.ObjectId,
  action: String,
  comment: String,
  performedBy: mongoose.Schema.Types.ObjectId,
  role: String
}, { timestamps: true });

module.exports = mongoose.model("ReviewLog", logSchema);