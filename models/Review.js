// models/Review.js
const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  aiPrompt: String,
  aiOutput: String,

  status: {
    state: {
      type: String,
      enum: ["approved", "rejected", "under_review", "pending"],
      default: "pending"
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

  lockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },

  lockedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model("Review", reviewSchema);