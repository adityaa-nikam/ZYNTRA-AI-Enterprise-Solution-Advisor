const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false
    },
    action: {
      type: String,
      required: true,
      enum: [
        "USER_REGISTER",
        "USER_LOGIN",
        "USER_LOGOUT",
        "REPORT_GENERATED",
        "REPORT_SAVED",
        "REPORT_VIEWED",
        "REPORT_RENAMED",
        "REPORT_DUPLICATED",
        "REPORT_DELETED",
        "REPORT_SHARED"
      ]
    },
    details: {
      type: String,
      default: ""
    },
    ipAddress: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);
