const express = require("express"); // Trigger restart
const mongoose = require("mongoose");
require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");

const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");

const allowedOrigins = [
  "http://localhost:5173",
  "https://rubi-frontend.vercel.app",
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

  // ROUTES
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/reviews", require("./routes/reviewRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/users", require("./routes/userRoutes"));

//test route
app.get("/", (req, res) => {
  res.send("Backend working");
});

// SOCKET.IO SETUP
const server = http.createServer(app);

const io = new Server(server, {
  cors: { 
    origin: allowedOrigins,
    credentials: true
  }
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

server.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});