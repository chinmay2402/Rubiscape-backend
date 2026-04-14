const Review = require("../models/Review");
const ReviewLog = require("../models/ReviewLog");

// GET REVIEWER STATS
exports.getReviewerStats = async (req, res) => {
  const stats = await Review.aggregate([
    {
      $group: {
        _id: "$status.updatedBy",
        approved: {
          $sum: { $cond: [{ $eq: ["$status.type", "approved"] }, 1, 0] }
        },
        rejected: {
          $sum: { $cond: [{ $eq: ["$status.type", "rejected"] }, 1, 0] }
        }
      }
    }
  ]);

  res.json(stats);
};

// ADMIN MODIFY
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

// REASSIGN
exports.reassign = async (req, res) => {
  const { reviewerId } = req.body;

  const review = await Review.findById(req.params.id);

  review.assignedTo = reviewerId;
  review.isLocked = false;

  await review.save();

  res.json({ msg: "Reassigned" });
};