const express = require("express");
const router = express.Router();

const { getMyProfile, getUserProfile } = require("../controllers/userController");
const auth = require("../middleware/auth");

router.get("/me", auth, getMyProfile);
router.get("/:id", auth, getUserProfile);

module.exports = router;