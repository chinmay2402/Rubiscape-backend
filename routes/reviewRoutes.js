const express = require("express");
const router = express.Router();

const {
  createReview,
  getReviewerTasks,
  lockReview,
  unlockReview,
  submitReview,
  getLogs
} = require("../controllers/reviewController");

const auth = require("../middleware/auth");

router.post("/", auth, createReview);
router.get("/", auth, getReviewerTasks);
router.get("/:id/logs", auth, getLogs);
router.post("/:id/lock", auth, lockReview);
router.post("/:id/unlock", auth, unlockReview);
router.post("/:id/submit", auth, submitReview);

module.exports = router;