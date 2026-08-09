const Report = require("../models/Report");
const AuditLog = require("../models/AuditLog");
const crypto = require("crypto");

// Helper to log audit events safely
const logAudit = async (userId, action, details, req) => {
  try {
    await AuditLog.create({
      userId: userId || null,
      action,
      details,
      ipAddress: req?.ip || ""
    });
  } catch (err) {
    console.error("Audit log error:", err.message);
  }
};

// POST /reports/save
exports.saveReport = async (req, res) => {
  try {
    const { company, analysis, title, userId } = req.body;

    if (!company || !analysis) {
      return res.status(400).json({ success: false, message: "company and analysis are required." });
    }

    const assignedUserId = req.user?._id || userId || null;

    const report = await Report.create({
      company,
      analysis,
      title: title || `${company} AI Strategy Deliverable`,
      industry: analysis.industry || "",
      sourcesUsed: analysis.sourcesUsed || req.body.sourcesUsed || [],
      userId: assignedUserId
    });

    await logAudit(assignedUserId, "REPORT_SAVED", `Saved report '${report.title}' for ${company}`, req);

    res.status(201).json({ success: true, report });
  } catch (err) {
    console.error("Save Report Error:", err);
    res.status(500).json({ success: false, message: "Failed to save report." });
  }
};

// GET /reports (Search, Filter by Date, Sort by Date, Pagination)
exports.getReports = async (req, res) => {
  try {
    const { search, startDate, endDate, sort = "desc", bookmarkedOnly } = req.query;

    let query = {};

    // User Scoping: Non-admins see only their own reports
    if (req.user && req.user.role !== "Admin") {
      query.userId = req.user._id;
    }

    // Search Filter (Company, Title, Industry)
    if (search) {
      const searchRegex = new RegExp(search, "i");
      query.$or = [
        { company: searchRegex },
        { title: searchRegex },
        { industry: searchRegex }
      ];
    }

    // Date Range Filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // Bookmark Filter
    if (bookmarkedOnly === "true") {
      query.isBookmarked = true;
    }

    const sortOrder = sort === "asc" ? 1 : -1;

    const reports = await Report.find(query)
      .select("title company industry analysis.priority analysis.estimatedROI analysis.implementationTime isBookmarked isShared shareToken createdAt userId")
      .sort({ createdAt: sortOrder });

    res.json({
      success: true,
      count: reports.length,
      reports
    });
  } catch (err) {
    console.error("Get Reports Error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch reports." });
  }
};

// GET /reports/:id
exports.getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ success: false, message: "Report not found." });
    }

    await logAudit(req.user?._id, "REPORT_VIEWED", `Viewed report '${report.title}' (${report._id})`, req);

    res.json({ success: true, report });
  } catch (err) {
    console.error("Get Report By ID Error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch report." });
  }
};

// PUT /reports/:id/title (Rename Report Title)
exports.updateReportTitle = async (req, res) => {
  try {
    const { title } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: "New title is required." });
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: "Report not found." });
    }

    const oldTitle = report.title;
    report.title = title.trim();
    await report.save();

    await logAudit(req.user?._id, "REPORT_RENAMED", `Renamed report from '${oldTitle}' to '${report.title}'`, req);

    res.json({ success: true, report });
  } catch (err) {
    console.error("Update Title Error:", err);
    res.status(500).json({ success: false, message: "Failed to rename report." });
  }
};

// POST /reports/:id/duplicate (Duplicate Existing Report)
exports.duplicateReport = async (req, res) => {
  try {
    const originalReport = await Report.findById(req.params.id);
    if (!originalReport) {
      return res.status(404).json({ success: false, message: "Report not found to duplicate." });
    }

    const duplicatedReport = await Report.create({
      company: originalReport.company,
      industry: originalReport.industry,
      title: `Copy of ${originalReport.title}`,
      analysis: originalReport.analysis,
      userId: req.user?._id || originalReport.userId
    });

    await logAudit(req.user?._id, "REPORT_DUPLICATED", `Duplicated report '${originalReport.title}' as '${duplicatedReport.title}'`, req);

    res.status(201).json({ success: true, report: duplicatedReport });
  } catch (err) {
    console.error("Duplicate Report Error:", err);
    res.status(500).json({ success: false, message: "Failed to duplicate report." });
  }
};

// PATCH /reports/:id/bookmark (Toggle Bookmark Status)
exports.toggleBookmark = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: "Report not found." });
    }

    report.isBookmarked = !report.isBookmarked;
    await report.save();

    res.json({ success: true, isBookmarked: report.isBookmarked, report });
  } catch (err) {
    console.error("Toggle Bookmark Error:", err);
    res.status(500).json({ success: false, message: "Failed to toggle bookmark." });
  }
};

// POST /reports/:id/share (Generate Public Share Token)
exports.generateShareLink = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: "Report not found." });
    }

    if (!report.shareToken) {
      report.shareToken = crypto.randomBytes(16).toString("hex");
      report.isShared = true;
      await report.save();
    }

    await logAudit(req.user?._id, "REPORT_SHARED", `Generated share token for report '${report.title}'`, req);

    res.json({
      success: true,
      shareToken: report.shareToken,
      shareUrl: `http://localhost:5173/share/${report.shareToken}`
    });
  } catch (err) {
    console.error("Generate Share Link Error:", err);
    res.status(500).json({ success: false, message: "Failed to generate share link." });
  }
};

// GET /reports/share/:shareToken (Public Share Link Access)
exports.getSharedReport = async (req, res) => {
  try {
    const report = await Report.findOne({ shareToken: req.params.shareToken });
    if (!report) {
      return res.status(404).json({ success: false, message: "Shared report not found or link expired." });
    }

    res.json({ success: true, report });
  } catch (err) {
    console.error("Get Shared Report Error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch shared report." });
  }
};

// DELETE /reports/:id
exports.deleteReport = async (req, res) => {
  try {
    const report = await Report.findByIdAndDelete(req.params.id);

    if (!report) {
      return res.status(404).json({ success: false, message: "Report not found." });
    }

    await logAudit(req.user?._id, "REPORT_DELETED", `Deleted report '${report.title}' (${report._id})`, req);

    res.json({ success: true, message: "Report deleted successfully." });
  } catch (err) {
    console.error("Delete Report Error:", err);
    res.status(500).json({ success: false, message: "Failed to delete report." });
  }
};