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
              $cond: [{ $eq: ["$isLocked", true] }, 1, 0]
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

    // Pending (locked)
    const pending = await Review.find({
      assignedTo: reviewerId,
      isLocked: true
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
  const { decision, comment } = req.body;

  const review = await Review.findById(req.params.id);

  review.status = {
    type: decision,
    updatedBy: "admin",
    updatedAt: new Date(),
    comment
  };

  await review.save();

  await ReviewLog.create({
    reviewId: review._id,
    action: "admin_modified",
    comment,
    performedBy: req.user.id,
    role: "admin"
  });

  res.json({ msg: "Updated by admin" });
};

// ==========================
// REASSIGN
// ==========================
exports.reassign = async (req, res) => {
  const { reviewerId } = req.body;

  const review = await Review.findById(req.params.id);

  review.assignedTo = reviewerId;
  review.isLocked = false;

  await review.save();

  res.json({ msg: "Reassigned" });
};