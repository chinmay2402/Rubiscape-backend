// models/Review.js
const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  aiPrompt: String,
  aiOutput: String,

  status: {
    type: {
      type: String,
      enum: ["approved", "rejected", "needs_review", null],
      default: null
    },
    updatedBy: String,
    updatedAt: Date,
    comment: String
  },

  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },

  isLocked: {
    type: Boolean,
    default: false
  },

  flowableTaskId: {
  type: String,
  default: null
}
}, { timestamps: true });

module.exports = mongoose.model("Review", reviewSchema);