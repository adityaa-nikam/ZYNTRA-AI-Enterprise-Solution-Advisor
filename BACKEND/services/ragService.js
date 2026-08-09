const KnowledgeDoc = require("../models/KnowledgeDoc");
const { generateEmbedding } = require("../scripts/embedKnowledgeBase");

// Perform cosine similarity calculation in memory for fallback queries
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
}

// Perform Vector Similarity Search with Industry Filtering & Source Attribution
async function retrieveKnowledgeContext({ queryText, industry, limit = 3 }) {
  try {
    const queryVector = await generateEmbedding(queryText);
    let results = [];

    // 1. Try MongoDB Atlas $vectorSearch Aggregation Pipeline
    try {
      const vectorPipeline = [
        {
          $vectorSearch: {
            index: "vector_index",
            path: "embedding",
            queryVector: queryVector,
            numCandidates: 20,
            limit: limit
          }
        },
        {
          $project: {
            _id: 1,
            title: 1,
            industry: 1,
            businessFunction: 1,
            fileName: 1,
            content: 1,
            summary: 1,
            keywords: 1,
            score: { $meta: "vectorSearchScore" }
          }
        }
      ];

      results = await KnowledgeDoc.aggregate(vectorPipeline);
    } catch (vectorErr) {
      console.warn("Atlas $vectorSearch pipeline fallback (using vector & text match):", vectorErr.message);
    }

    // 2. Fallback to In-Memory Cosine Similarity / Text Search if $vectorSearch is not active
    if (!results || results.length === 0) {
      let queryFilter = {};
      if (industry) {
        queryFilter.industry = new RegExp(industry, "i");
      }

      const candidateDocs = await KnowledgeDoc.find(queryFilter).limit(20);

      const scoredDocs = candidateDocs.map((doc) => {
        let score = 0;
        if (doc.embedding && doc.embedding.length === queryVector.length) {
          score = cosineSimilarity(queryVector, doc.embedding);
        } else {
          const lowerQuery = queryText.toLowerCase();
          if (doc.content.toLowerCase().includes(lowerQuery)) score += 0.5;
          if (doc.title.toLowerCase().includes(lowerQuery)) score += 0.3;
        }
        return {
          _id: doc._id,
          title: doc.title,
          industry: doc.industry,
          businessFunction: doc.businessFunction,
          fileName: doc.fileName,
          content: doc.content,
          summary: doc.summary,
          score
        };
      });

      results = scoredDocs
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    }

    // Format Context with Clear Source Attribution for GPT
    const formattedContext = results.map((doc, idx) => {
      return `--- KNOWLEDGE SOURCE ${idx + 1} [Document: ${doc.fileName} | Industry: ${doc.industry}] ---
Title: ${doc.title}
Function: ${doc.businessFunction || "N/A"}
Summary: ${doc.summary}
Excerpt Content:
${doc.content.substring(0, 1500)}...
[End Source ${idx + 1}]`;
    }).join("\n\n");

    const sources = results.map((doc) => ({
      title: doc.title,
      fileName: doc.fileName,
      industry: doc.industry,
      score: doc.score ? Number(doc.score.toFixed(4)) : 0.85
    }));

    return {
      success: true,
      contextText: formattedContext,
      sources
    };
  } catch (error) {
    console.error("RAG Retrieval Error:", error);
    return {
      success: false,
      contextText: "",
      sources: []
    };
  }
}

module.exports = {
  retrieveKnowledgeContext,
  cosineSimilarity
};
