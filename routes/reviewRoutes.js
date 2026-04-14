const express = require("express");
const router = express.Router();

const {
  createReview,
  getReviewerTasks,
  lockReview,
  submitReview
} = require("../controllers/reviewController");

const auth = require("../middleware/auth");

router.post("/", auth, createReview);
router.get("/", auth, getReviewerTasks);
router.post("/:id/lock", auth, lockReview);
router.post("/:id/submit", auth, submitReview);
//router.get("/:id/logs", auth, getLogs);

module.exports = router;