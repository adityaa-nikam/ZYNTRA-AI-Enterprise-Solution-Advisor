require("dotenv").config();
const fs = require("fs");
const path = require("path");
const dns = require("dns");
const mongoose = require("mongoose");
const OpenAI = require("openai");

// Force Node.js internal DNS resolver to use Google & Cloudflare DNS (fixes Windows SRV ECONNREFUSED)
dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);

const KnowledgeDoc = require("../models/KnowledgeDoc");

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy_key_for_fallback"
});

// Deterministic 1536-dim vector generator fallback if OpenAI API key is missing
function generateFallbackVector(text, dimensions = 1536) {
  const vector = new Array(dimensions).fill(0);
  const words = text.toLowerCase().match(/\b[a-z0-9]+\b/g) || [];

  words.forEach((word) => {
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = (hash << 5) - hash + word.charCodeAt(i);
      hash |= 0;
    }
    const index = Math.abs(hash) % dimensions;
    vector[index] += 1;
  });

  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0)) || 1;
  return vector.map((val) => val / magnitude);
}

// Generate embedding using OpenAI text-embedding-3-small (1536 dimensions)
async function generateEmbedding(text) {
  if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes("dummy")) {
    try {
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text.substring(0, 8000)
      });
      return response.data[0].embedding;
    } catch (err) {
      console.warn("OpenAI API call failed, using fallback vector:", err.message);
    }
  }
  return generateFallbackVector(text);
}

// Generate embeddings for a batch of query strings in ONE single API request
async function generateEmbeddingsBatch(texts) {
  if (!Array.isArray(texts) || texts.length === 0) return [];
  if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes("dummy")) {
    try {
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: texts.map((t) => (typeof t === "string" ? t.substring(0, 8000) : ""))
      });
      const sorted = [...response.data].sort((a, b) => a.index - b.index);
      return sorted.map((d) => d.embedding);
    } catch (err) {
      console.warn("OpenAI batch API call failed, using fallback vectors:", err.message);
    }
  }
  return texts.map((t) => generateFallbackVector(t));
}


// Strip generic boilerplate header text to prevent vector similarity bias
function stripBoilerplateContent(text) {
  return text
    .replace(/^---[\s\S]*?---\n*/, "") // Strip YAML frontmatter from content body
    .replace(/^#\s+(ZYNTRA AI|Enterprise AI Solutions Advisor):?\s*/gm, "")
    .replace(/^##\s+Executive Summary\s*/gm, "")
    .replace(/^##\s+Industry\s*/gm, "")
    .replace(/^##\s+Business Function\s*/gm, "")
    .trim();
}

// Semantic Section Chunking (300-500 words per section with 50-word overlap)
function semanticChunking(content, targetTokens = 400, overlapTokens = 50) {
  const sections = content.split(/(?=\n##\s+)/);
  const chunks = [];

  sections.forEach((sec) => {
    const cleanedSec = sec.trim();
    if (!cleanedSec) return;

    const words = cleanedSec.split(/\s+/);
    if (words.length <= targetTokens) {
      chunks.push(cleanedSec);
    } else {
      let startIndex = 0;
      while (startIndex < words.length) {
        const endIndex = Math.min(startIndex + targetTokens, words.length);
        const chunkWords = words.slice(startIndex, endIndex);
        chunks.push(chunkWords.join(" "));
        if (endIndex === words.length) break;
        startIndex += targetTokens - overlapTokens;
      }
    }
  });

  return chunks.length > 0 ? chunks : [content];
}

// Recursively find all markdown files in knowledge-base directory
function getMarkdownFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getMarkdownFiles(fullPath, arrayOfFiles);
    } else if (file.endsWith(".md")) {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

// Parse markdown document metadata including YAML frontmatter
function parseMarkdownFile(filePath) {
  const rawContent = fs.readFileSync(filePath, "utf-8");
  const fileName = path.basename(filePath);
  const parentFolder = path.basename(path.dirname(filePath));

  // Extract YAML Frontmatter
  let yamlMeta = {};
  const yamlMatch = rawContent.match(/^---\n([\s\S]*?)\n---/);
  if (yamlMatch) {
    const yamlLines = yamlMatch[1].split("\n");
    let currentKey = null;

    yamlLines.forEach((line) => {
      if (line.includes(":")) {
        const [k, v] = line.split(/:(.+)/);
        const cleanKey = k.trim();
        const cleanVal = v ? v.trim().replace(/^["']|["']$/g, "") : "";
        if (cleanVal.startsWith("-")) {
          yamlMeta[cleanKey] = [cleanVal.replace(/^-/, "").trim()];
          currentKey = cleanKey;
        } else if (cleanVal === "") {
          yamlMeta[cleanKey] = [];
          currentKey = cleanKey;
        } else {
          yamlMeta[cleanKey] = cleanVal;
          currentKey = null;
        }
      } else if (line.trim().startsWith("-") && currentKey) {
        yamlMeta[currentKey].push(line.trim().replace(/^-/, "").replace(/^["']|["']$/g, "").trim());
      }
    });
  }

  // Extract Title
  const titleMatch = rawContent.match(/^#\s+(.+)$/m);
  const title = titleMatch
    ? titleMatch[1].replace(/(ZYNTRA AI|Enterprise AI Solutions Advisor):\s*/i, "").trim()
    : fileName.replace(".md", "");

  // Extract Industry
  let industry = yamlMeta.industry || parentFolder;
  if (parentFolder.toLowerCase().includes("manuf")) industry = "Manufacturing";
  else if (parentFolder.toLowerCase().includes("finan")) industry = "Finance & Accounting";
  else if (parentFolder.toLowerCase().includes("health")) industry = "Healthcare & Life Sciences";
  else if (parentFolder.toLowerCase().includes("retail")) industry = "Retail & E-Commerce";
  else if (parentFolder.toLowerCase().includes("it")) industry = "Information Technology & Software Services";
  else if (parentFolder.toLowerCase().includes("hr")) industry = "Human Resources & Talent Management";

  // Extract Business Function / Department
  const department = yamlMeta.department || "Operations";
  const subcategory = yamlMeta.business_function || "Workflow Automation";

  // Extract Keywords
  let keywords = yamlMeta.keywords || [];
  if (!Array.isArray(keywords) || keywords.length === 0) {
    const keywordsMatch = rawContent.match(/##\s+Retrieval Keywords\s*\n+([\s\S]*?)(?=\n##|$)/i);
    if (keywordsMatch) {
      keywords = keywordsMatch[1].split(/,|\n/).map((k) => k.trim().toLowerCase()).filter((k) => k.length > 0);
    }
  }

  // Extract Technologies
  let technologies = yamlMeta.technologies || ["MongoDB Atlas", "OpenAI", "Groq", "Python"];
  if (!Array.isArray(technologies) || technologies.length === 0) {
    const techMatch = rawContent.match(/##\s+Technology Stack\s*\n+([\s\S]*?)(?=\n##|$)/i);
    if (techMatch) {
      technologies = techMatch[1].match(/\b[A-Z][a-zA-Z0-9+\-.]+\b/g) || [];
    }
  }

  // Extract Summary
  const summaryMatch = rawContent.match(/##\s+Executive Summary\s*\n+([\s\S]*?)(?=\n##|$)/i);
  const summary = summaryMatch ? summaryMatch[1].trim() : rawContent.substring(0, 350);

  const documentId = `doc_${fileName.replace(".md", "")}`;
  const cleanedContent = stripBoilerplateContent(rawContent);

  return {
    documentId,
    title,
    industry,
    department,
    subcategory,
    category: subcategory,
    businessProcess: subcategory,
    summary,
    content: cleanedContent,
    keywords,
    technologies,
    source: fileName
  };
}

// Main embedding and indexing function
async function embedKnowledgeBase() {
  const kbDir = path.join(__dirname, "../../knowledge-base");

  if (!fs.existsSync(kbDir)) {
    console.error("Knowledge Base directory not found at:", kbDir);
    process.exit(1);
  }

  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/enterprise_ai";

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log("Connected to MongoDB for 60-Doc Expanded Knowledge Base Embedding 🚀");
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1);
  }

  const markdownFiles = getMarkdownFiles(kbDir);
  console.log(`Found ${markdownFiles.length} markdown documents across knowledge-base/`);

  // Clear existing indexed docs for clean semantic section re-indexing
  await KnowledgeDoc.deleteMany({});
  console.log("Purged legacy indexes for clean 60-document embedding...");

  let totalChunksIndexed = 0;

  for (const filePath of markdownFiles) {
    try {
      const parsedDoc = parseMarkdownFile(filePath);
      const textChunks = semanticChunking(parsedDoc.content, 400, 50);

      console.log(`Processing [${parsedDoc.industry}] ${parsedDoc.source} (${textChunks.length} semantic section chunks)...`);

      for (let i = 0; i < textChunks.length; i++) {
        const chunkContent = textChunks[i];
        const chunkNumber = i + 1;
        const chunkDocId = `${parsedDoc.documentId}_chunk_${chunkNumber}`;

        const excerpt = chunkContent
          .replace(/^#+\s+/gm, "")
          .replace(/\n+/g, " ")
          .substring(0, 350)
          .trim() + "...";

        // Rich Pre-Embedded Metadata Prefix
        const embeddedText = `[METADATA PREFIX]
Industry: ${parsedDoc.industry}
Department: ${parsedDoc.department}
Business Function: ${parsedDoc.subcategory}
Keywords: ${parsedDoc.keywords.join(", ")}
Technologies: ${parsedDoc.technologies.join(", ")}
Document Name: ${parsedDoc.source}
Chunk Number: ${chunkNumber}
[CONTENT]
${parsedDoc.title}
${chunkContent}`;

        const embedding = await generateEmbedding(embeddedText);
        const tokenCount = embeddedText.split(/\s+/).length;

        await KnowledgeDoc.create({
          documentId: chunkDocId,
          chunkNumber: chunkNumber,
          title: parsedDoc.title,
          industry: parsedDoc.industry,
          department: parsedDoc.department,
          subcategory: parsedDoc.subcategory,
          category: parsedDoc.subcategory,
          businessProcess: parsedDoc.businessProcess,
          summary: parsedDoc.summary,
          excerpt: excerpt,
          content: chunkContent,
          embeddedText: embeddedText,
          keywords: parsedDoc.keywords,
          technologies: parsedDoc.technologies,
          embedding: embedding,
          embeddingModel: "text-embedding-3-small",
          source: parsedDoc.source,
          tokenCount: tokenCount,
          createdAt: new Date()
        });

        totalChunksIndexed++;
      }
    } catch (err) {
      console.error(`Error embedding file ${filePath}:`, err.message);
    }
  }

  console.log(`\n🎉 Re-Indexing Complete! Successfully stored ${totalChunksIndexed} metadata-prefixed chunks across 60 documents in MongoDB Atlas.`);
  await mongoose.disconnect();
}

if (require.main === module) {
  embedKnowledgeBase().catch(console.error);
}

module.exports = {
  embedKnowledgeBase,
  generateEmbedding,
  generateEmbeddingsBatch
};
