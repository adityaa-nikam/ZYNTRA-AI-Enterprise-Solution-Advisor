const User = require("../models/User");
const Report = require("../models/Report");
const AuditLog = require("../models/AuditLog");

// GET /api/admin/analytics
exports.getAdminAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalReports = await Report.countDocuments();

    // Reports generated today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const reportsToday = await Report.countDocuments({ createdAt: { $gte: startOfToday } });

    // Calculate Average ROI %
    const reports = await Report.find().select("analysis.roiPercentage analysis.industry company createdAt");
    let sumROI = 0;
    let validROICount = 0;

    const industryMap = {};

    reports.forEach((r) => {
      const roi = r.analysis?.roiPercentage;
      if (typeof roi === "number") {
        sumROI += roi;
        validROICount++;
      }

      const ind = r.analysis?.industry || r.industry || "General";
      industryMap[ind] = (industryMap[ind] || 0) + 1;
    });

    const averageROI = validROICount > 0 ? Math.round(sumROI / validROICount) : 25;

    // Top Industries distribution for Recharts
    const industryDistribution = Object.keys(industryMap).map((key) => ({
      name: key,
      count: industryMap[key]
    })).sort((a, b) => b.count - a.count).slice(0, 6);

    // Recent Audit Logs
    const recentAuditLogs = await AuditLog.find()
      .populate("userId", "name email role")
      .sort({ createdAt: -1 })
      .limit(15);

    res.json({
      success: true,
      analytics: {
        totalUsers,
        totalReports,
        reportsToday,
        averageROI,
        industryDistribution,
        recentAuditLogs
      }
    });
  } catch (error) {
    console.error("Admin Analytics Error:", error);
    res.status(500).json({ success: false, message: "Failed to load admin analytics." });
  }
};

// GET /api/admin/users
exports.getAdminUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, users });
  } catch (error) {
    console.error("Get Admin Users Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch users." });
  }
};

// PUT /api/admin/users/:id/role
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!["Client", "Consultant", "Admin"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role specified." });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    user.role = role;
    await user.save();

    await AuditLog.create({
      userId: req.user._id,
      action: "USER_REGISTER",
      details: `Admin changed role of '${user.email}' to '${role}'`
    });

    res.json({ success: true, user });
  } catch (error) {
    console.error("Update User Role Error:", error);
    res.status(500).json({ success: false, message: "Failed to update user role." });
  }
};

// DELETE /api/admin/users/:id
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    res.json({ success: true, message: "User deleted successfully." });
  } catch (error) {
    console.error("Delete User Error:", error);
    res.status(500).json({ success: false, message: "Failed to delete user." });
  }
};
