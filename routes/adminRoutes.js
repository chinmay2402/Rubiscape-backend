const express = require("express");
const router = express.Router();

const {
  getReviewerStats,
  getReviewerDetails,
  adminModify,
  reassign
} = require("../controllers/adminController");

const auth = require("../middleware/auth");

router.get("/stats", auth, getReviewerStats);

// 🔥 NEW ROUTE
router.get("/:reviewerId/details", auth, getReviewerDetails);

router.post("/:id/modify", auth, adminModify);
router.post("/:id/reassign", auth, reassign);

module.exports = router;