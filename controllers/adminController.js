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
              $cond: [{ $eq: ["$status.state", "approved"] }, 1, 0]
            }
          },
          rejected: {
            $sum: {
              $cond: [{ $eq: ["$status.state", "rejected"] }, 1, 0]
            }
          },
          pending: {
            $sum: {
              $cond: [{ $eq: ["$status.state", "pending"] }, 1, 0]
            }
          },
          under_review: {
            $sum: {
              $cond: [{ $eq: ["$status.state", "under_review"] }, 1, 0]
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
        pending: stat?.pending || 0,
        under_review: stat?.under_review || 0,
        total: (stat?.approved || 0) + (stat?.rejected || 0) + (stat?.pending || 0) + (stat?.under_review || 0)
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
      "status.state": "approved"
    }).select("aiPrompt aiOutput status.updatedAt");

    // Rejected
    const rejected = await Review.find({
      assignedTo: reviewerId,
      "status.state": "rejected"
    }).select("aiPrompt aiOutput status.updatedAt");

    // Pending (all items with no status decision)
    const pending = await Review.find({
      assignedTo: reviewerId,
      "status.state": "pending"
    }).select("aiPrompt aiOutput createdAt isLocked lockedBy")
    .populate("lockedBy", "name")
    .populate("assignedTo", "name");

    // Under Review
    const underReview = await Review.find({
      assignedTo: reviewerId,
      "status.state": "under_review"
    }).select("aiPrompt aiOutput status.updatedAt isLocked lockedBy")
    .populate("lockedBy", "name")
    .populate("assignedTo", "name");

    res.json({
      approved,
      rejected,
      pending,
      underReview
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
    const { decision, comment, target } = req.body; // target: 'pool' or 'reviewer'
    const review = await Review.findById(req.params.id);

    if (!review) return res.status(404).json({ error: "Review not found" });

    // 🔥 GUARD: Admin only touches APPROVED or REJECTED tasks
    const activeStates = ['pending', 'under_review'];
    if (activeStates.includes(review.status?.state)) {
      return res.status(403).json({ 
        error: `Cannot modify a task in ${review.status.state} state. Admins only manage finalized reviews.` 
      });
    }

    // ENFORCE COMMENT for any admin change
    if (!comment) {
      return res.status(400).json({ error: "Comment is mandatory for admin modifications." });
    }

    if (decision === 'send_back') {
      // 1. Return to Global Pool
      if (target === 'pool') {
        review.status = {
          state: "pending",
          updatedBy: "admin",
          updatedAt: new Date(),
          comment: `Reset to pool: ${comment}`
        };
        review.assignedTo = null;
        review.isLocked = false;
        review.lockedBy = null;
        review.lockedAt = null;
      } 
      // 2. Return to Reviewer (RELOCK)
      else {
        review.status = {
          state: "under_review",
          updatedBy: "admin",
          updatedAt: new Date(),
          comment: `Manual re-review requested: ${comment}`
        };
        // Re-lock for the existing assignee
        review.isLocked = true;
        review.lockedBy = review.assignedTo;
        review.lockedAt = new Date();
      }
    } else {
      // Direct Status Override (e.g., Force Approve)
      review.status = {
        state: decision,
        updatedBy: "admin",
        updatedAt: new Date(),
        comment: `Admin override: ${comment}`
      };
      
      // Auto-unlock on final decision
      review.isLocked = false;
      review.lockedBy = null;
      review.lockedAt = null;
    }

    await review.save();

    await ReviewLog.create({
      reviewId: review._id,
      action: decision === 'send_back' ? 'sent_back' : 'admin_modified',
      comment,
      performedBy: req.user.id,
      role: "admin",
      snapshot: {
        aiPrompt: review.aiPrompt,
        aiOutput: review.aiOutput,
        status: review.status
      }
    });

    res.json({ msg: "Updated by admin", review });
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
    review.lockedBy = null;
    review.lockedAt = null;

    // 🔥 RESET STATUS FOR NEW ASSIGNEE
    review.status = {
      state: "pending",
      updatedBy: "admin",
      updatedAt: new Date(),
      comment: "Reassigned by admin"
    };

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
      .select("aiPrompt aiOutput createdAt status");
    res.json(unassigned);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch unassigned tasks" });
  }
};
// ==========================
// ✅ 6. GET ALL TASKS (Filter by Status)
// ==========================
exports.getAllTasks = async (req, res) => {
  try {
    const { status } = req.query; // all, approved, rejected, under_review, pending
    
    let query = {};
    
    if (status && status !== 'all') {
      query["status.state"] = status;
    }

    const reviews = await Review.find(query)
      .populate("assignedTo", "name")
      .populate("lockedBy", "name")
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
};
