const Review = require("../models/Review");
const ReviewLog = require("../models/ReviewLog");
const User = require("../models/User");

// CREATE REVIEW
exports.createReview = async (req, res) => {
  try {
    const { aiPrompt, aiOutput } = req.body;

    // Save in Mongo with explicit pending status
    const review = await Review.create({ 
      aiPrompt, 
      aiOutput,
      status: { 
        state: "pending", 
        updatedAt: new Date(),
        comment: "Initial submission"
      }
    });

    res.json(review);

  } catch (err) {
    console.error("Error creating review:", err.message);
    res.status(500).json({ error: "Failed to create review" });
  }
};

// GET REVIEWER TASKS
exports.getReviewerTasks = async (req, res) => {
  try {
    const reviews = await Review.find({
      $or: [
        { assignedTo: req.user.id },
        { assignedTo: null, isLocked: false }
      ]
    });
    res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
};

// LOCK REVIEW
exports.lockReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    const io = req.app.get("io");

    if (!review) return res.status(404).json({ msg: "Review not found" });

    if (review.isLocked && review.lockedBy?.toString() !== req.user.id) {
       return res.status(400).json({ msg: "Already locked by another reviewer" });
    }

    review.isLocked = true;
    review.lockedBy = req.user.id;
    review.lockedAt = new Date();
    
    // AUTO-TRANSITION TO UNDER_REVIEW
    review.status.state = "under_review";
    review.status.updatedBy = req.user.name;
    review.status.updatedAt = new Date();
    review.status.comment = "Reviewer picked up the task";

    // If it was unassigned, assign it to the locker
    if (!review.assignedTo) {
      review.assignedTo = req.user.id;
    }

    review.markModified('status');
    await review.save();

    // LOG Action
    await ReviewLog.create({
      reviewId: review._id,
      action: "locked",
      performedBy: req.user.id,
      assignedTo: review.assignedTo,
      role: "reviewer",
      snapshot: {
        aiPrompt: review.aiPrompt,
        aiOutput: review.aiOutput,
        status: review.status
      }
    });

    io.emit("reviewLocked", {
      reviewId: review._id,
      lockedBy: req.user.id
    });
    
    res.json(review);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lock failed" });
  }
};

// UNLOCK REVIEW
exports.unlockReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    const io = req.app.get("io");

    if (!review) return res.status(404).json({ msg: "Review not found" });
    if (!review.isLocked) return res.json({ msg: "Not locked" });

    if (review.lockedBy?.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ msg: "Not authorized to unlock" });
    }

    review.isLocked = false;
    review.lockedBy = null;
    review.lockedAt = null;

    // RESET TO GLOBAL POOL
    review.status = {
      state: "pending",
      updatedBy: req.user.name,
      updatedAt: new Date(),
      comment: "Lock released by reviewer"
    };
    review.assignedTo = null;

    review.markModified('status');
    await review.save();

    // LOG Action
    await ReviewLog.create({
      reviewId: review._id,
      action: "unlocked",
      performedBy: req.user.id,
      assignedTo: review.assignedTo,
      role: req.user.role,
      snapshot: {
        aiPrompt: review.aiPrompt,
        aiOutput: review.aiOutput,
        status: review.status
      }
    });

    io.emit("reviewUnlocked", { reviewId: review._id });
    res.json({ msg: "Unlocked successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Unlock failed" });
  }
};

// SUBMIT REVIEW
exports.submitReview = async (req, res) => {
  try {
    const { decision, comment } = req.body;
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ msg: "Review not found" });
    }

    // Update Mongo Status
    review.status.state = decision;
    review.status.updatedBy = req.user.name;
    review.status.updatedAt = new Date();
    review.status.comment = comment;

    // Clear Locks
    review.isLocked = false;
    review.lockedBy = null;
    review.lockedAt = null;

    review.markModified('status');
    await review.save();
    
    const io = req.app.get("io");
    io.emit("reviewUpdated", {
      reviewId: review._id,
      status: review.status
    });

    // Log the decision
    await ReviewLog.create({
      reviewId: review._id,
      action: decision,
      comment,
      performedBy: req.user.id,
      assignedTo: review.assignedTo,
      role: "reviewer",
      snapshot: {
        aiPrompt: review.aiPrompt,
        aiOutput: review.aiOutput,
        status: review.status
      }
    });

    res.json({ msg: "Review submitted successfully" });

  } catch (err) {
    console.error("Submit error:", err.message);
    res.status(500).json({ error: "Submit failed" });
  }
};

exports.getLogs = async (req, res) => {
  try {
    const logs = await ReviewLog.find({ reviewId: req.params.id })
      .populate("performedBy", "name role")
      .populate("assignedTo", "name role");
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch logs" });
  }
};