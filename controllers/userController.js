const User = require("../models/User");

// GET OWN PROFILE
exports.getMyProfile = async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  res.json(user);
};

// ADMIN GET USER PROFILE
exports.getUserProfile = async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");
  res.json(user);
};