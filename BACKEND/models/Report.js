const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false
    },
    title: {
      type: String,
      trim: true,
      default: ""
    },
    company: {
      type: String,
      required: true,
      trim: true
    },
    industry: {
      type: String,
      trim: true,
      default: ""
    },
    analysis: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    isBookmarked: {
      type: Boolean,
      default: false
    },
    isShared: {
      type: Boolean,
      default: false
    },
    shareToken: {
      type: String,
      default: ""
    },
    sourcesUsed: [
      {
        title: String,
        source: String,
        industry: String,
        score: Number
      }
    ]
  },
  { timestamps: true }
);

// Pre-save hook: set default title if empty
reportSchema.pre("save", function (next) {
  if (!this.title) {
    this.title = `${this.company || "Enterprise"} AI Strategy Deliverable`;
  }
  if (!this.industry && this.analysis?.industry) {
    this.industry = this.analysis.industry;
  }
  next();
});

module.exports = mongoose.model("Report", reportSchema);