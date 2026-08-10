require("dotenv").config();
const express = require("express");
const cors = require("cors");

// Import Routes
const analysisRoutes = require("./routes/analysisRoutes");
const reportRoutes = require("./routes/reportRoutes");
const authRoutes = require("./routes/authRoutes");
const chatRoutes = require("./routes/chatRoutes");
const adminRoutes = require("./routes/adminRoutes");
const ragRoutes = require("./routes/ragRoutes");

// Import DB connection
const connectDB = require("./config/db");

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json());

// Home Route
app.get("/", (req, res) => {
    res.send("Backend Running 🚀");
});

// Register Routes
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/rag", ragRoutes);
app.use("/", analysisRoutes);
app.use("/reports", reportRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});