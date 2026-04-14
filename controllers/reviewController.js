const Review = require("../models/Review");
const ReviewLog = require("../models/ReviewLog");
const flowable = require("../services/flowableService");

// CREATE REVIEW + START FLOWABLE
exports.createReview = async (req, res) => {
  try {
    const { aiPrompt, aiOutput } = req.body;

    // 1. Save in Mongo
    const review = await Review.create({ aiPrompt, aiOutput });

    // 2. Start Flowable process
    const processRes = await flowable.startProcess(review._id.toString());

    // 3. Wait a bit (Flowable async)
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 4. Fetch task from Flowable
    const taskRes = await flowable.getTasks();

    const task = taskRes.data.data.find(t =>
      t.processInstanceId === processRes.data.id
    );

    if (!task) {
      return res.status(500).json({ error: "Task not created" });
    }

    // 5. Store taskId in Mongo
    review.flowableTaskId = task.id;
    await review.save();

    res.json(review);

  } catch (err) {
    console.error("Error:", err.response?.data || err.message);
    res.status(500).json({ error: "Flowable integration failed" });
  }
};

// GET REVIEWER TASKS
exports.getReviewerTasks = async (req, res) => {
const reviews = await Review.find({
  isLocked: false,
  $or: [
    { "status.type": null },
    { "status.updatedBy": req.user.name }
  ]
});

  res.json(reviews);
};

// LOCK REVIEW
exports.lockReview = async (req, res) => {
  const review = await Review.findById(req.params.id);
  const io = req.app.get("io");

  if (review.isLocked && review.assignedTo?.toString() !== req.user.id) {
    return res.status(400).json({ msg: "Already locked" });
  }

  review.isLocked = true;
  review.assignedTo = req.user.id;

  await review.save();
  io.emit("reviewLocked", {
    reviewId: review._id,
    assignedTo: req.user.id
  });
  res.json(review);
};

// SUBMIT REVIEW
exports.submitReview = async (req, res) => {
  try {
    const { decision, comment } = req.body;

    const review = await Review.findById(req.params.id);

    if (!review.flowableTaskId) {
      return res.status(400).json({ msg: "No Flowable task linked" });
    }

    // 🔥 STEP 1: Map decision (IMPORTANT)
    let flowableDecision;

    if (decision === "approved") flowableDecision = "approve";
    else if (decision === "rejected") flowableDecision = "reject";
    else flowableDecision = "needs_review";

    // 2. Update Mongo (keep your format)
    review.status = {
      type: decision,
      updatedBy: req.user.name,
      updatedAt: new Date(),
      comment
    };

    review.isLocked = false;

    await review.save();
    const io = req.app.get("io");

io.emit("reviewUpdated", {
  reviewId: review._id,
  status: review.status
});

    // 3. Log
    await ReviewLog.create({
      reviewId: review._id,
      action: decision,
      comment,
      performedBy: req.user.id,
      role: "reviewer"
    });

    // 🔥 STEP 2: Send mapped value to Flowable
    await flowable.completeTask(review.flowableTaskId, flowableDecision);

    // 4. Clear taskId
    review.flowableTaskId = null;
    await review.save();

    res.json({ msg: "Review submitted successfully" });

  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Submit failed" });
  }
};

exports.getLogs = async (req, res) => {
  const logs = await ReviewLog.find({ reviewId: req.params.id });
  res.json(logs);
};