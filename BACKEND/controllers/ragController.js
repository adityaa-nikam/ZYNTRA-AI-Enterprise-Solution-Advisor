const KnowledgeDoc = require("../models/KnowledgeDoc");
const { searchVectorKnowledgeBase } = require("../services/vectorSearchService");
const { generateEmbedding } = require("../scripts/embedKnowledgeBase");

// POST /api/rag/search (Similarity Search API)
exports.searchKnowledgeBase = async (req, res) => {
  try {
    const { query, industry, limit = 5 } = req.body;
    if (!query) {
      return res.status(400).json({ success: false, message: "Query text is required." });
    }

    const docs = await searchVectorKnowledgeBase(query, { industry, limit });

    res.json({
      success: true,
      count: docs.length,
      documents: docs
    });
  } catch (error) {
    console.error("Search Knowledge Base Error:", error);
    res.status(500).json({ success: false, message: "Failed to perform similarity search." });
  }
};

// POST /api/rag/test-search (Internal Retrieval Test Page Endpoint - Returns Top 10)
exports.testSearchKnowledgeBase = async (req, res) => {
  try {
    const { query, industry, limit = 10 } = req.body;
    if (!query) {
      return res.status(400).json({ success: false, message: "Query parameter is required." });
    }

    const startTime = Date.now();
    const docs = await searchVectorKnowledgeBase(query, { industry, limit });
    const totalTimeMs = Date.now() - startTime;

    res.json({
      success: true,
      query,
      totalTimeMs,
      count: docs.length,
      embeddingModel: "text-embedding-3-small",
      queryEmbeddingLength: 1536,
      documents: docs
    });
  } catch (error) {
    console.error("Test Search Error:", error);
    res.status(500).json({ success: false, message: "Retrieval test failed." });
  }
};

// POST /api/rag/upload (Admin Upload API)
exports.uploadDocument = async (req, res) => {
  try {
    const { title, industry, businessFunction, fileName, content, summary, keywords } = req.body;

    if (!title || !industry || !content) {
      return res.status(400).json({ success: false, message: "title, industry, and content are required." });
    }

    const docFileName = fileName || `${title.toLowerCase().replace(/[^a-z0-9]/g, "_")}.md`;
    const textToEmbed = `${title}\n${summary || ""}\n${content}`;
    const embedding = await generateEmbedding(textToEmbed);

    const doc = await KnowledgeDoc.findOneAndUpdate(
      { source: docFileName },
      {
        documentId: `doc_${docFileName.replace(".md", "")}`,
        chunkNumber: 1,
        title,
        industry,
        subcategory: businessFunction || "General",
        category: businessFunction || "General",
        source: docFileName,
        content,
        summary: summary || content.substring(0, 350),
        excerpt: content.substring(0, 350) + "...",
        keywords: keywords || [],
        embedding,
        embeddingModel: "text-embedding-3-small",
        createdAt: new Date()
      },
      { upsert: true, returnDocument: "after" }
    );

    res.status(201).json({
      success: true,
      message: "Document indexed successfully into vector database.",
      doc: { _id: doc._id, title: doc.title, source: doc.source }
    });
  } catch (error) {
    console.error("Upload Knowledge Doc Error:", error);
    res.status(500).json({ success: false, message: "Failed to upload and index document." });
  }
};

// POST /api/rag/index (Automatic Batch Indexing API)
exports.reindexAll = async (req, res) => {
  try {
    const { embedKnowledgeBase } = require("../scripts/embedKnowledgeBase");
    
    // Trigger batch embedding in background
    embedKnowledgeBase().catch((err) => console.error("Background indexing error:", err));

    res.json({
      success: true,
      message: "Batch chunked knowledge base re-indexing pipeline triggered successfully."
    });
  } catch (error) {
    console.error("Reindex All Error:", error);
    res.status(500).json({ success: false, message: "Failed to trigger re-indexing." });
  }
};
