// controllers/authController.js
const User = require("../models/User");
const UserLog = require("../models/UserLog");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Wrong password" });

    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Log the login event
    try {
      await UserLog.create({
        userId: user._id,
        userName: user.name,
        userEmail: user.email,
        action: "login",
        ipAddress: req.ip,
        userAgent: req.get("User-Agent")
      });

      // Emit real-time update to all connected clients
      const io = req.app.get("io");
      io.emit("userActivity", {
        action: "login",
        userId: user._id,
        userName: user.name,
        userEmail: user.email,
        timestamp: new Date()
      });
    } catch (logErr) {
      console.error("Failed to log login:", logErr);
    }

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.logout = async (req, res) => {
  const { userId } = req.body;
  
  if (!userId) return res.status(400).json({ msg: "User ID required" });

  try {
    const user = await User.findById(userId);
    if (user) {
      await UserLog.create({
        userId: user._id,
        userName: user.name,
        userEmail: user.email,
        action: "logout",
        ipAddress: req.ip,
        userAgent: req.get("User-Agent")
      });

      // Emit real-time update to all connected clients
      const io = req.app.get("io");
      io.emit("userActivity", {
        action: "logout",
        userId: user._id,
        userName: user.name,
        userEmail: user.email,
        timestamp: new Date()
      });
    }
    
    res.clearCookie("token");
    res.json({ msg: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashed,
      role
    });

    // Emit real-time update for new user creation
    const io = req.app.get("io");
    io.emit("userActivity", {
      action: "user_created",
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      userRole: user.role,
      timestamp: new Date()
    });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};