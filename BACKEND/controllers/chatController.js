const ChatHistory = require("../models/ChatHistory");
const Report = require("../models/Report");
const mongoose = require("mongoose");
const { generateAIChatFollowup } = require("../services/aiService");

// GET /api/chat/:reportId
exports.getChatHistory = async (req, res) => {
  try {
    const { reportId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      return res.json({ success: true, chat: { reportId, messages: [] } });
    }

    let chat = await ChatHistory.findOne({ reportId });

    if (!chat) {
      chat = { reportId, messages: [] };
    }

    res.json({ success: true, chat });
  } catch (error) {
    console.error("Get Chat History Error:", error);
    res.status(500).json({ success: false, message: "Failed to load chat history." });
  }
};

// POST /api/chat/:reportId/message
exports.sendMessage = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { message, reportData } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: "Message text is required." });
    }

    let report = null;

    if (mongoose.Types.ObjectId.isValid(reportId)) {
      report = await Report.findById(reportId);
    }

    if (!report && reportData) {
      report = reportData;
    }

    if (!report) {
      report = {
        company: "Enterprise Client",
        analysis: {
          industry: "General",
          executiveSummary: "AI Strategy assessment report.",
          recommendations: []
        }
      };
    }

    const validReportId = report._id && mongoose.Types.ObjectId.isValid(report._id)
      ? report._id
      : new mongoose.Types.ObjectId();

    let chat = await ChatHistory.findOne({ reportId: validReportId });

    if (!chat) {
      chat = new ChatHistory({
        reportId: validReportId,
        userId: req.user?._id || report.userId || null,
        messages: []
      });
    }

    // Call AI Service with full report context
    const aiReply = await generateAIChatFollowup(report, chat.messages, message);

    chat.messages.push({
      sender: "user",
      text: message,
      timestamp: new Date()
    });

    chat.messages.push({
      sender: "ai",
      text: aiReply,
      timestamp: new Date()
    });

    await chat.save();

    res.json({
      success: true,
      chat
    });
  } catch (error) {
    console.error("Send Chat Message Error:", error.message || error);
    res.status(500).json({ success: false, message: "Failed to send message to AI." });
  }
};
