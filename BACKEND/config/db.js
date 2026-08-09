const mongoose = require("mongoose");
const dns = require("dns");

// Force Node's internal resolver to use Google DNS —
// fixes "querySrv ECONNREFUSED" on some Windows setups
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const connectDB = async () => {
  try {
    const uri =
      process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ai-solutions-advisor";

    await mongoose.connect(uri);

    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
  }
};

module.exports = connectDB;