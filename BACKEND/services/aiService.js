/**
 * aiService.js
 *
 * LLM Call 2 — Evidence-Grounded Enterprise Report Generation
 * LLM utility — used by context extraction, report generation, and validation
 */

const Groq = require("groq-sdk");
const OpenAI = require("openai");

const groqApiKey = process.env.GROQ_API_KEY;
let groq = null;
if (groqApiKey) {
  groq = new Groq({ apiKey: groqApiKey });
}

const openRouterApiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
let openRouter = null;
if (openRouterApiKey) {
  openRouter = new OpenAI({
    baseURL: process.env.OPENROUTER_API_KEY ? "https://openrouter.ai/api/v1" : undefined,
    apiKey: openRouterApiKey
  });
}

/**
 * Call LLM with configurable temperature.
 * @param {string}  prompt
 * @param {boolean} isJson       - Request JSON response format
 * @param {number}  temperature  - 0.1 for deterministic, 0.3 for creative
 */
async function callLLM(prompt, isJson = true, temperature = 0.2) {
  if (groq) {
    try {
      console.log("Generating LLM completion via Groq API (llama-3.3-70b-versatile)...");
      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.3-70b-versatile",
        temperature,
        ...(isJson && { response_format: { type: "json_object" } })
      });
      return completion.choices[0]?.message?.content || "";
    } catch (err) {
      console.warn("Groq API call failed, falling back to OpenRouter/OpenAI:", err.message);
    }
  }

  if (openRouter) {
    console.log("Generating LLM completion via OpenRouter / OpenAI API...");
    const modelName = process.env.OPENROUTER_API_KEY ? "openai/gpt-4o-mini" : "gpt-4o-mini";
    const completion = await openRouter.chat.completions.create({
      model: modelName,
      messages: [{ role: "user", content: prompt }],
      temperature,
      ...(isJson && { response_format: { type: "json_object" } })
    });
    return completion.choices[0]?.message?.content || "";
  }

  throw new Error("No valid LLM API keys (GROQ_API_KEY or OPENROUTER_API_KEY) found in environment.");
}


async function generateAIRecommendations(businessData) {
  const startTime = Date.now();

  try {
    // 1. RAG Vector Search: Query MongoDB Atlas Vector Search with industry filtering
    const searchQuery = `${businessData.challenges} ${businessData.industry}`.trim();
    console.log(`🔍 RAG Pipeline: Executing Vector Search for query: "${searchQuery}" in [${businessData.industry}]...`);

    const vectorStartTime = Date.now();
    let vectorDocs = [];
    try {
      vectorDocs = await searchVectorKnowledgeBase(searchQuery, {
        limit: 5,
        industry: businessData.industry,
        strictIndustryFilter: true
      });
    } catch (vectorErr) {
      console.warn("RAG Vector Search fallback execution:", vectorErr.message);
    }
    const vectorSearchMs = Date.now() - vectorStartTime;

    // 2. Format Sources Used List with real excerpts, scores, and whySelected reasons
    const sourcesUsed = vectorDocs.map((doc) => ({
      documentId: doc.metadata.documentId,
      chunkNumber: doc.metadata.chunkNumber,
      title: doc.metadata.title,
      source: doc.metadata.source,
      industry: doc.metadata.industry,
      category: doc.metadata.category,
      rawScore: doc.rawScore,
      similarityPercentage: doc.similarityPercentage,
      whySelected: doc.whySelected,
      matchedKeywords: doc.matchedKeywords,
      summary: doc.metadata.summary,
      excerpt: doc.metadata.excerpt,
      embeddingModel: doc.metadata.embeddingModel
    }));

    const primaryDoc = vectorDocs[0]?.metadata || { title: "Enterprise AI Strategy Framework", source: "01_enterprise_consulting.md" };

    const ragContextText = vectorDocs.length > 0
      ? vectorDocs.map((doc, idx) => `
--- RETRIEVED KNOWLEDGE DOCUMENT ${idx + 1} [Source: ${doc.metadata.source} | Industry: ${doc.metadata.industry} | Raw Score: ${doc.rawScore} | Match: ${doc.similarityPercentage}%] ---
Document ID: ${doc.metadata.documentId}
Title: ${doc.metadata.title}
Category: ${doc.metadata.category}
Summary: ${doc.metadata.summary}
Excerpt Content:
${doc.content.substring(0, 1500)}
[End Source ${idx + 1}]
`).join("\n")
      : "No direct vector match found. Apply standard enterprise consulting frameworks.";

    // 3. System Prompt with Strict RAG Grounding & Specific Roadmap Mandate
    const prompt = `
You are ZYNTRA AI — Senior Enterprise Intelligence Partner advising C-suite executives. Enterprise Intelligence. Engineered. From Business Problems to AI Solutions.

RETRIEVED KNOWLEDGE BASE CONTEXT (Top 5 Distinct MongoDB Vector Search Results):
${ragContextText}

TARGET CLIENT PROFILE:
Company Name: ${businessData.companyName}
Industry: ${businessData.industry}
Employees: ${businessData.employees}
Annual Revenue: ${businessData.revenue}
Primary Business Challenge: ${businessData.challenges}

STRICT GROUNDING & CONTENT MANDATES:
1. Executive Summary MUST explicitly reference the retrieved enterprise consulting knowledge base document (e.g. "Based on enterprise implementations documented in ${primaryDoc.source} (${primaryDoc.title}), organizations facing ${businessData.challenges} deploy...").
2. Implementation Roadmap MUST generate SPECIFIC, TECHNICAL, DOMAIN-TAILORED phases based on the retrieved document solution architecture (e.g., if RAG is about Invoice Automation, Phase 1 = SAP & AP Workflow Mapping, Phase 2 = LayoutLM OCR Integration, Phase 3 = Automated 3-Way Matching & SAP BAPI Integration, Phase 4 = Exception Queue & Compliance Analytics). Do NOT use generic titles like "Phase 1 Assessment"!
3. For EVERY recommendation, provide a "grounding" object with "basedOnDocument", "confidenceScore" (e.g. 91), and "supportingEvidence" citing actual benchmark data from the retrieved text.
4. Include a "benchmarkEvidence" string in the ROI section citing published operational benchmark data from the retrieved text.

Return EXACTLY this JSON structure:

{
  "executiveSummary": "Based on enterprise AI transformation frameworks in ${primaryDoc.source} (${primaryDoc.title}), organizations in ${businessData.industry} addressing ${businessData.challenges} deploy...",
  "primaryChallenge": "Clear restatement of client business challenge",
  "painPoints": [
    "Pain point 1 description",
    "Pain point 2 description",
    "Pain point 3 description"
  ],
  "painPointSeverity": [
    { "point": "Pain Point 1 Label", "severity": 8 },
    { "point": "Pain Point 2 Label", "severity": 6 },
    { "point": "Pain Point 3 Label", "severity": 7 }
  ],
  "recommendations": [
    {
      "title": "Specific AI Solution Title (from RAG text)",
      "description": "Strategic recommendation summary grounded in retrieved text...",
      "benefits": [
        "Key Benefit 1",
        "Key Benefit 2"
      ],
      "impactScore": 9,
      "effortScore": 4,
      "grounding": {
        "basedOnDocument": "${primaryDoc.source}",
        "confidenceScore": 92,
        "supportingEvidence": "Direct supporting evidence or benchmark from retrieved text..."
      }
    }
  ],
  "estimatedROI": "Financial ROI summary (e.g. 250% ROI within 12 months)",
  "benchmarkEvidence": "Based on benchmark case studies in ${primaryDoc.source}, automated 3-way matching yields 400% throughput improvement and 85% processing cost reduction.",
  "roiPercentage": 250,
  "annualSavingsUSD": 1200000,
  "implementationTime": "Timeline summary (e.g. 6 Months)",
  "implementationMonths": 6,
  "priority": "High",
  "priorityScore": 9,
  "riskScore": 3,
  "digitalTransformationScore": 78,
  "suggestedTechStack": ["Python", "TensorFlow", "FastAPI", "MongoDB Atlas", "React"],
  "businessMaturity": {
    "automationReadiness": 7,
    "dataArchitecture": 6,
    "processMaturity": 8,
    "securityGovernance": 8,
    "aiAdoptionCapable": 9
  },
  "implementationRoadmap": [
    {
      "phase": "Phase 1",
      "title": "Specific Technical Phase 1 (e.g. SAP & AP Workflow Mapping)",
      "duration": "Week 1",
      "status": "completed",
      "description": "Analyze current workflows and collect baseline data.",
      "deliverables": ["Process Mapping", "Stakeholder Interviews", "Tech Audit"],
      "roiPercentage": 5,
      "impactScore": 7,
      "difficultyLevel": "Low",
      "estimatedCostUSD": 25000
    },
    {
      "phase": "Phase 2",
      "title": "Specific Technical Phase 2 (e.g. OCR Engine Integration & Model Fine-Tuning)",
      "duration": "Weeks 2-5",
      "status": "current",
      "description": "Deploy targeted AI prototype for key pilot team.",
      "deliverables": ["AI Prototype Integration", "Pilot Group Testing", "User Feedback"],
      "roiPercentage": 15,
      "impactScore": 8,
      "difficultyLevel": "Medium",
      "estimatedCostUSD": 65000
    },
    {
      "phase": "Phase 3",
      "title": "Specific Technical Phase 3 (e.g. 3-Way Match & ERP BAPI Posting)",
      "duration": "Month 2-4",
      "status": "upcoming",
      "description": "Deploy AI solutions across business units with automated guardrails.",
      "deliverables": ["Staff Training", "Production Deployment", "Security Monitoring"],
      "roiPercentage": 25,
      "impactScore": 9,
      "difficultyLevel": "High",
      "estimatedCostUSD": 110000
    },
    {
      "phase": "Phase 4",
      "title": "Specific Technical Phase 4 (e.g. Exception Queue & Continuous AP Analytics)",
      "duration": "Month 5-6",
      "status": "future",
      "description": "Continuous accuracy tuning and ROI validation.",
      "deliverables": ["Performance Tuning", "Quality Audits", "ROI Validation"],
      "roiPercentage": 35,
      "impactScore": 9,
      "difficultyLevel": "Medium",
      "estimatedCostUSD": 50000
    }
  ],
  "nextSteps": [
    "Establish AI Steering Committee",
    "Finalize Data Ingestion Pipeline",
    "Initiate Phase 1 Assessment"
  ]
}
`;

    const llmStartTime = Date.now();
    const rawResponse = await callLLM(prompt, true);
    const llmLatencyMs = Date.now() - llmStartTime;

    let cleaned = rawResponse.trim();
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.replace(/^```json/, "").replace(/```$/, "").trim();
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```/, "").replace(/```$/, "").trim();
    }

    const parsedData = JSON.parse(cleaned);

    const totalPipelineMs = Date.now() - startTime;

    // Attach RAG Debug Payload & Sources
    parsedData.sourcesUsed = sourcesUsed;
    parsedData.ragDebug = {
      searchQuery: searchQuery,
      queryEmbeddingLength: 1536,
      embeddingModel: "text-embedding-3-small",
      vectorSearchMs: vectorSearchMs,
      llmLatencyMs: llmLatencyMs,
      totalPipelineMs: totalPipelineMs,
      promptInjectedLength: prompt.length,
      promptInjectedSnippet: prompt.substring(0, 800) + "..."
    };

    return parsedData;
  } catch (error) {
    console.error("AI Analysis Error:", error);
    throw error;
  }
}

// Follow-up Chatbot Grounded in Assessment, Report, RAG Docs & History
async function generateAIChatFollowup(report, conversationHistory, userQuestion) {
  try {
    const company = report.company || report.companyName || "Enterprise Client";
    const analysis = report.analysis || {};
    const sources = report.sourcesUsed || analysis.sourcesUsed || [];

    const sourcesSummary = sources.length > 0
      ? sources.map((s, i) => `[Source ${i + 1}: ${s.title} (${s.source}) - ${s.whySelected || ""}]`).join("\n")
      : "Standard Enterprise AI Frameworks";

    const historyFormatted = (conversationHistory || [])
      .slice(-6)
      .map((msg) => `${msg.sender === "user" ? "Client" : "AI Consultant"}: ${msg.text}`)
      .join("\n");

    const prompt = `
You are ZYNTRA AI — Enterprise Intelligence Partner answering executive follow-up questions regarding a ZYNTRA AI Consulting Deliverable.

CLIENT ASSESSMENT & REPORT CONTEXT:
- Company: ${company}
- Industry: ${analysis.industry || "General Enterprise"}
- Primary Challenge: ${analysis.primaryChallenge || "Operational Efficiency"}
- Executive Summary: ${analysis.executiveSummary || "N/A"}
- Key Recommendations: ${(analysis.recommendations || []).map((r) => r.title).join("; ")}
- Implementation Roadmap Phases: ${(analysis.implementationRoadmap || []).map((p) => p.phase + ": " + p.title).join("; ")}

RETRIEVED RAG KNOWLEDGE SOURCES USED:
${sourcesSummary}

RECENT CONVERSATION HISTORY:
${historyFormatted}

NEW USER QUESTION:
"${userQuestion}"

INSTRUCTIONS:
1. Provide a direct, highly professional executive consulting answer.
2. Ground your response in the client report and retrieved knowledge sources.
3. If asked about "Explain Recommendation", "Alternative Solution", "Reduce Cost", "Generate Email", "Implementation Roadmap", "Architecture", or "Risk Analysis", format response cleanly with bullet points.
4. Keep response under 300 words. Use GitHub Markdown formatting.
`;

    const reply = await callLLM(prompt, false);
    return reply.trim();
  } catch (err) {
    console.error("AI Chat Followup Error:", err.message);
    return "I analyzed your question against the consulting deliverable and knowledge base. Let me know if you would like me to break down cost reduction strategies or generate an executive summary email.";
  }
}

/**
 * STAGE 4 — LLM Call 2: Evidence-Grounded Enterprise Report Generation
 *
 * PART 5: Every recommendation must cite source document, chunk ID, confidence.
 * PART 6: Receives merged evidence blocks (not independent chunks) for richer context.
 *
 * @param {object} businessContext  - From contextExtractionService
 * @param {Array}  topChunks        - Top 5 reranked evidence chunks
 * @param {string} companyName
 * @param {string} companySize      - e.g. "Large Enterprise (500+ employees)"
 * @param {Array}  evidenceBlocks   - Aggregated evidence blocks (from PART 6)
 * @param {Array}  sourceCitations  - Per-chunk citations (from PART 5)
 * @returns {object} Full report JSON
 */
async function generateReportFromEvidence(businessContext, topChunks, companyName, companySize, evidenceBlocks = [], sourceCitations = []) {
  const llmStart = Date.now();

  const primaryDoc = topChunks[0]?.metadata || { title: "Enterprise AI Strategy Framework", source: "enterprise_ai.md" };

  // ── PART 6: Use merged evidence blocks for richer context ─────────────────
  const evidenceToUse = evidenceBlocks.length > 0 ? evidenceBlocks : topChunks.map((c) => ({
    source: c.metadata.source,
    title: c.metadata.title,
    industry: c.metadata.industry,
    department: c.metadata.department,
    technologies: c.metadata.technologies || [],
    summary: c.metadata.summary,
    chunkIds: [c.metadata.chunkNumber],
    content: c.content || ""
  }));

  // ── PART 5: Build citation reference table for the LLM ───────────────────
  const citationTable = (sourceCitations.length > 0 ? sourceCitations : topChunks.map((c, i) => ({
    source: c.metadata?.source,
    chunkId: c.metadata?.chunkNumber,
    similarity: c.similarityPercentage || Math.round((c.hybridScore || c.rawScore || 0) * 100),
    confidence: (c.similarityPercentage || 0) >= 85 ? "High" : "Medium",
    title: c.metadata?.title,
    industry: c.metadata?.industry
  }))).map((cit, i) =>
    `[REF${i + 1}] Source: ${cit.source} | Chunk: #${cit.chunkId} | Similarity: ${cit.similarity}% | Confidence: ${cit.confidence} | Title: ${cit.title}`
  ).join("\n");

  const ragContextText = evidenceToUse.length > 0
    ? evidenceToUse.map((block, idx) => `
=== EVIDENCE BLOCK ${idx + 1} [Source: ${block.source} | Industry: ${block.industry} | Chunks: ${(block.chunkIds || []).join(", ")}] ===
Title: ${block.title}
Industry: ${block.industry}
Department: ${block.department || "Operations"}
Technologies: ${(block.technologies || []).join(", ")}
Summary: ${block.summary}
Content:
${(block.content || "").substring(0, 1400)}
[End Block ${idx + 1}]
`).join("\n")
    : "No direct evidence retrieved. Apply standard enterprise consulting frameworks.";

  const prompt = `You are ZYNTRA AI — Senior Enterprise Intelligence Partner advising C-suite executives. Enterprise Intelligence. Engineered. From Business Problems to AI Solutions.

RETRIEVED ENTERPRISE KNOWLEDGE (Merged Evidence Blocks from MongoDB Atlas Vector Search):
${ragContextText}

SOURCE CITATION REFERENCE TABLE:
${citationTable}

CLIENT BUSINESS CONTEXT (Structured — DO NOT invent beyond this):
Company: ${companyName}
Size: ${companySize}
Industry: ${businessContext.industry}
Department: ${businessContext.department}
Business Functions: ${(businessContext.businessFunctions || []).join(", ")}
Pain Points: ${(businessContext.painPoints || []).join("; ")}
Business Goals: ${(businessContext.businessGoals || []).join("; ")}
Current Systems: ${(businessContext.currentSystems || []).join(", ") || "Not specified"}
Relevant Technologies: ${(businessContext.technologies || []).join(", ")}

STRICT GROUNDING MANDATES:
1. Executive Summary MUST explicitly reference the evidence source (e.g. "Based on implementations in ${primaryDoc.source} (${primaryDoc.title})...")
2. Every recommendation MUST include a "citation" object with: sourceDocument, chunkId, similarity, confidence, and a direct quote or paraphrase from the evidence.
3. Implementation Roadmap MUST use specific technology/process names from the evidence (NOT generic "Phase 1 Assessment").
4. Never invent technologies, benchmarks, or statistics not present in the retrieved evidence.
5. ROI figures must reference benchmark data from the evidence where available.

Return EXACTLY this JSON structure:

{
  "executiveSummary": "Based on enterprise AI implementations documented in ${primaryDoc.source} (${primaryDoc.title}), organizations in ${businessContext.industry} facing [specific pain points] deploy [specific AI solutions from evidence]...",
  "primaryChallenge": "Precise restatement of client business challenge",
  "painPoints": ["Pain point 1", "Pain point 2", "Pain point 3", "Pain point 4"],
  "painPointSeverity": [
    { "point": "Pain Point Label", "severity": 8 },
    { "point": "Pain Point Label", "severity": 7 }
  ],
  "recommendations": [
    {
      "title": "Specific AI Solution Title (from retrieved evidence)",
      "description": "Strategic recommendation grounded in retrieved evidence, citing specific case study or benchmark data...",
      "benefits": ["Key Benefit 1 with metric if available", "Key Benefit 2"],
      "impactScore": 9,
      "effortScore": 4,
      "grounding": {
        "basedOnDocument": "${primaryDoc.source}",
        "confidenceScore": 92,
        "supportingEvidence": "Direct paraphrase from evidence: [specific fact or benchmark from the evidence block]"
      },
      "citation": {
        "sourceDocument": "${primaryDoc.source}",
        "chunkId": 2,
        "similarity": 94,
        "confidence": "High",
        "excerpt": "Relevant quote or paraphrase from the evidence"
      }
    }
  ],
  "estimatedROI": "Financial ROI summary from evidence benchmarks",
  "benchmarkEvidence": "Benchmark data cited from retrieved evidence (e.g. '400% throughput improvement per industry study in source.md')",
  "roiPercentage": 250,
  "annualSavingsUSD": 1200000,
  "implementationTime": "Timeline based on evidence",
  "implementationMonths": 6,
  "priority": "High",
  "priorityScore": 9,
  "riskScore": 3,
  "digitalTransformationScore": 78,
  "suggestedTechStack": ["Technologies explicitly mentioned in evidence"],
  "businessMaturity": {
    "automationReadiness": 7,
    "dataArchitecture": 6,
    "processMaturity": 8,
    "securityGovernance": 8,
    "aiAdoptionCapable": 9
  },
  "implementationRoadmap": [
    {
      "phase": "Phase 1",
      "title": "Domain-specific Phase 1 title (e.g. SAP AP Workflow Analysis & OCR Setup)",
      "duration": "Week 1-2",
      "status": "completed",
      "description": "Specific technical steps based on evidence",
      "deliverables": ["Domain-specific deliverable 1", "Domain-specific deliverable 2"],
      "roiPercentage": 5,
      "impactScore": 7,
      "difficultyLevel": "Low",
      "estimatedCostUSD": 25000
    },
    {
      "phase": "Phase 2",
      "title": "Domain-specific Phase 2 title (e.g. IDP Model Training & Integration)",
      "duration": "Weeks 3-6",
      "status": "current",
      "description": "Specific technical steps based on evidence",
      "deliverables": ["Domain-specific deliverable 1", "Domain-specific deliverable 2"],
      "roiPercentage": 15,
      "impactScore": 8,
      "difficultyLevel": "Medium",
      "estimatedCostUSD": 65000
    },
    {
      "phase": "Phase 3",
      "title": "Domain-specific Phase 3 title (e.g. 3-Way PO Matching & ERP Posting)",
      "duration": "Month 2-4",
      "status": "upcoming",
      "description": "Specific technical steps based on evidence",
      "deliverables": ["Domain-specific deliverable 1", "Domain-specific deliverable 2"],
      "roiPercentage": 25,
      "impactScore": 9,
      "difficultyLevel": "High",
      "estimatedCostUSD": 110000
    },
    {
      "phase": "Phase 4",
      "title": "Domain-specific Phase 4 title (e.g. Exception Queue & Analytics Dashboard)",
      "duration": "Month 5-6",
      "status": "future",
      "description": "Continuous optimization and ROI measurement",
      "deliverables": ["Performance Dashboard", "ROI Validation Report"],
      "roiPercentage": 35,
      "impactScore": 9,
      "difficultyLevel": "Medium",
      "estimatedCostUSD": 50000
    }
  ],
  "roadmap": [
    { "phase": "Phase 1 (Days 1-30)", "title": "Foundation & Discovery", "actions": ["Action 1 from evidence", "Action 2"] },
    { "phase": "Phase 2 (Days 31-60)", "title": "Core Integration", "actions": ["Action 1 from evidence", "Action 2"] },
    { "phase": "Phase 3 (Days 61-90)", "title": "Scale & Governance", "actions": ["Action 1 from evidence", "Action 2"] }
  ],
  "riskMitigation": [
    { "risk": "Specific risk from evidence context", "impact": "High", "mitigation": "Specific mitigation strategy" },
    { "risk": "Data quality / change management risk", "impact": "Medium", "mitigation": "Specific mitigation strategy" }
  ],
  "nextSteps": ["Evidence-grounded next step 1", "Next step 2", "Next step 3"]
}`;

  const rawResponse = await callLLM(prompt, true, 0.3);
  const llmLatencyMs = Date.now() - llmStart;

  let cleaned = rawResponse.trim();
  if (cleaned.startsWith("```json")) cleaned = cleaned.replace(/^```json/, "").replace(/```$/, "").trim();
  else if (cleaned.startsWith("```")) cleaned = cleaned.replace(/^```/, "").replace(/```$/, "").trim();

  const parsed = JSON.parse(cleaned);
  parsed._llmLatencyMs = llmLatencyMs;
  return parsed;
}


module.exports = {
  generateAIRecommendations,
  generateReportFromEvidence,
  generateAIChatFollowup,
  callLLM
};