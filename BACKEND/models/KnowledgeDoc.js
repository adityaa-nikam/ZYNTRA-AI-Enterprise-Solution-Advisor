const mongoose = require("mongoose");

const knowledgeDocSchema = new mongoose.Schema(
  {
    documentId: {
      type: String,
      required: true,
      index: true
    },
    chunkNumber: {
      type: Number,
      required: true,
      default: 1
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    industry: {
      type: String,
      required: true,
      index: true
    },
    department: {
      type: String,
      default: "Operations",
      index: true
    },
    subcategory: {
      type: String,
      default: "General",
      index: true
    },
    category: {
      type: String,
      default: "General Consulting"
    },
    businessProcess: {
      type: String,
      default: "Enterprise Workflow"
    },
    summary: {
      type: String,
      default: ""
    },
    excerpt: {
      type: String,
      default: ""
    },
    content: {
      type: String,
      required: true
    },
    embeddedText: {
      type: String,
      required: true
    },
    keywords: [
      {
        type: String,
        lowercase: true,
        trim: true
      }
    ],
    technologies: [
      {
        type: String,
        trim: true
      }
    ],
    // Vector Embedding Array (1536 dimensions for text-embedding-3-small)
    embedding: {
      type: [Number],
      required: true,
select: true
    },
    embeddingModel: {
      type: String,
      default: "text-embedding-3-small"
    },
    source: {
      type: String,
      required: true,
      index: true
    },
    tokenCount: {
      type: Number,
      default: 400
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// Compound text index for hybrid keyword search
knowledgeDocSchema.index({
  title: "text",
  content: "text",
  keywords: "text",
  industry: "text",
  department: "text"
});

module.exports = mongoose.model("KnowledgeDoc", knowledgeDocSchema);
