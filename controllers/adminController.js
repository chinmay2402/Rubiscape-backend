const Review = require("../models/Review");
const ReviewLog = require("../models/ReviewLog");
const User = require("../models/User");

// ==========================
// ✅ 1. ADMIN STATS
// ==========================
exports.getReviewerStats = async (req, res) => {
  try {
    const reviewers = await User.find({ role: "reviewer" });

    const stats = await Review.aggregate([
      {
        $group: {
          _id: "$assignedTo",
          approved: {
            $sum: {
              $cond: [{ $eq: ["$status.type", "approved"] }, 1, 0]
            }
          },
          rejected: {
            $sum: {
              $cond: [{ $eq: ["$status.type", "rejected"] }, 1, 0]
            }
          },
          pending: {
            $sum: {
              $cond: [{ $eq: ["$status.type", null] }, 1, 0]
            }
          }
        }
      }
    ]);

    const result = reviewers.map((reviewer) => {
      const stat = stats.find(
        (s) => s._id?.toString() === reviewer._id.toString()
      );

      return {
        reviewerId: reviewer._id,
        name: reviewer.name,
        email: reviewer.email,
        approved: stat?.approved || 0,
        rejected: stat?.rejected || 0,
        pending: stat?.pending || 0
      };
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
};

// ==========================
// ✅ 2. REVIEWER DETAILS
// ==========================
exports.getReviewerDetails = async (req, res) => {
  try {
    const { reviewerId } = req.params;

    // Approved
    const approved = await Review.find({
      assignedTo: reviewerId,
      "status.type": "approved"
    }).select("aiPrompt aiOutput status.updatedAt");

    // Rejected
    const rejected = await Review.find({
      assignedTo: reviewerId,
      "status.type": "rejected"
    }).select("aiPrompt aiOutput status.updatedAt");

    // Pending (all items with no status decision)
    const pending = await Review.find({
      assignedTo: reviewerId,
      "status.type": null
    }).select("aiPrompt aiOutput createdAt");

    res.json({
      approved,
      rejected,
      pending
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch reviewer details" });
  }
};

// ==========================
// ADMIN MODIFY
// ==========================
exports.adminModify = async (req, res) => {
  try {
    const { decision, comment } = req.body;
    const review = await Review.findById(req.params.id);

    if (!review) return res.status(404).json({ error: "Review not found" });

    if (decision === 'pending') {
      // ✅ "Send Back" logic: reset status to null and unlock
      review.status = {
        type: null,
        updatedBy: "admin",
        updatedAt: new Date(),
        comment
      };
      review.isLocked = false;
    } else {
      review.status = {
        type: decision,
        updatedBy: "admin",
        updatedAt: new Date(),
        comment
      };
    }

    await review.save();

    await ReviewLog.create({
      reviewId: review._id,
      action: "admin_modified",
      comment,
      performedBy: req.user.id,
      role: "admin"
    });

    res.json({ msg: "Updated by admin" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to modify review" });
  }
};

// ==========================
// REASSIGN
// ==========================
exports.reassign = async (req, res) => {
  try {
    const { reviewerId } = req.body;
    const review = await Review.findById(req.params.id);

    if (!review) return res.status(404).json({ error: "Review not found" });

    review.assignedTo = reviewerId;
    review.isLocked = false;

    await review.save();

    res.json({ msg: "Reassigned" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to reassign review" });
  }
};

// ==========================
// UNASSIGNED TASKS
// ==========================
exports.getUnassignedTasks = async (req, res) => {
  try {
    const unassigned = await Review.find({ assignedTo: null })
      .select("aiPrompt aiOutput createdAt");
    res.json(unassigned);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch unassigned tasks" });
  }
};
