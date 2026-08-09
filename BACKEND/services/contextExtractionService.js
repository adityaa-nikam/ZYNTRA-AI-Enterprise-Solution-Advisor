/**
 * STAGE 1 — Business Context Extraction Service (Production Upgrade)
 *
 * Responsibility: Convert raw natural-language form input into a structured
 * JSON business context object. Generates 10-15 search queries across five
 * query types: keyword, semantic, business-function, technology, and industry.
 *
 * This service NEVER generates recommendations, ROI, or roadmaps.
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

async function callExtractionLLM(prompt) {
  if (groq) {
    try {
      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.3-70b-versatile",
        temperature: 0.1,
        response_format: { type: "json_object" }
      });
      return completion.choices[0]?.message?.content || "";
    } catch (err) {
      console.warn("[ContextExtraction] Groq failed, falling back to OpenRouter:", err.message);
    }
  }
  if (openRouter) {
    const modelName = process.env.OPENROUTER_API_KEY ? "openai/gpt-4o-mini" : "gpt-4o-mini";
    const completion = await openRouter.chat.completions.create({
      model: modelName,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      response_format: { type: "json_object" }
    });
    return completion.choices[0]?.message?.content || "";
  }
  throw new Error("No valid LLM API keys found for Context Extraction.");
}

/**
 * Build a diverse set of fallback search queries from raw form data.
 * Used when LLM extraction fails.
 */
function buildFallbackQueries(industry, challenges) {
  const ind = (industry || "").toLowerCase().trim();
  const words = (challenges || "").split(/\s+/).filter((w) => w.length > 4).slice(0, 6);
  return [
    // keyword queries
    `${ind} automation`,
    `${ind} AI transformation`,
    // semantic queries
    words.slice(0, 3).join(" "),
    `${ind} operational efficiency`,
    // business-function queries
    `${ind} process optimization`,
    `${ind} workflow automation`,
    // technology queries
    `AI machine learning ${ind}`,
    `predictive analytics ${ind}`,
    // industry queries
    `${ind} digital transformation`,
    `enterprise AI ${ind}`
  ].filter(Boolean).slice(0, 10);
}

/**
 * Extract structured business context from the raw assessment form data.
 * Generates 10-15 diversified search queries across 5 query type categories.
 *
 * @param {object} formData - { companyName, industry, employees, revenue, challenges }
 * @returns {object} businessContext - Structured JSON context for RAG pipeline
 */
async function extractBusinessContext(formData) {
  const { companyName, industry, employees, revenue, challenges } = formData;

  const prompt = `You are a Business Analysis AI. Your ONLY task is to extract structured business context from the input below and generate a comprehensive set of search queries for semantic retrieval.

DO NOT generate recommendations.
DO NOT calculate ROI.
DO NOT generate roadmaps.
DO NOT hallucinate fields.
Return ONLY valid JSON.

CLIENT INPUT:
Company: ${companyName}
Industry: ${industry}
Employees: ${employees}
Annual Revenue: ${revenue ? "$" + Number(revenue).toLocaleString() : "Not specified"}
Business Challenge / Goal:
${challenges}

Extract and return exactly this JSON structure. If a field cannot be determined from the input, use an empty array [].

CRITICAL: The "searchQueries" field must contain 10-15 queries spread across all 5 types below.

{
  "industry": "Canonical industry name matching the knowledge base (e.g. Healthcare & Life Sciences, Finance & Accounting, Manufacturing, Retail & E-Commerce, Banking & Capital Markets, Information Technology & Software Services, Logistics & Supply Chain, Education, Energy & Utilities, Government & Public Sector, Insurance, Legal Services, Real Estate, Telecommunications, Hospitality & Tourism, Human Resources)",
  "department": "Primary department affected (e.g. Finance, Operations, HR, IT, Legal, Marketing, Supply Chain, Procurement)",
  "businessFunctions": ["List of specific business functions involved (e.g. Accounts Payable, Invoice Processing, Patient Scheduling) — 2-5 items"],
  "painPoints": ["Specific pain points extracted from the challenge description — 4-8 items"],
  "businessGoals": ["Measurable business goals the client wants to achieve — 3-6 items"],
  "currentSystems": ["Existing systems or technologies mentioned (e.g. SAP, Salesforce, Oracle, Excel)"],
  "technologies": ["Relevant AI/automation technologies that would address these pain points (e.g. OCR, RPA, LLM, NLP, Computer Vision, IDP, Predictive Analytics) — 4-8 items"],
  "metadataFilters": {
    "industry": "Exact industry string to filter MongoDB metadata before vector search",
    "department": "Exact department to pre-filter",
    "industryConfidence": 85
  },
  "searchQueries": [
    "--- KEYWORD QUERIES (exact domain terms, 2-4 words each) ---",
    "keyword query 1 (e.g. invoice automation)",
    "keyword query 2 (e.g. accounts payable automation)",
    "keyword query 3 (e.g. ERP invoice processing)",
    "--- SEMANTIC QUERIES (conceptual intent, 3-6 words) ---",
    "semantic query 1 (e.g. reduce manual invoice processing effort)",
    "semantic query 2 (e.g. automate financial document workflows)",
    "--- BUSINESS FUNCTION QUERIES (function + AI pairing) ---",
    "function query 1 (e.g. AP workflow optimization AI)",
    "function query 2 (e.g. procurement process automation)",
    "--- TECHNOLOGY QUERIES (specific tech solutions) ---",
    "tech query 1 (e.g. OCR invoice extraction)",
    "tech query 2 (e.g. IDP document processing)",
    "tech query 3 (e.g. duplicate payment detection ML)",
    "--- INDUSTRY QUERIES (industry-specific use cases) ---",
    "industry query 1 (e.g. manufacturing finance automation)",
    "industry query 2 (e.g. enterprise ERP AI integration)"
  ]
}

IMPORTANT for searchQueries:
- Remove the comment lines starting with "---" from the actual output
- Return only the actual query strings in the array
- Each query must be 2-6 words, domain-specific, and directly relevant to the client's problem
- Avoid generic words like "help", "improve", "our", "the", "system"
- Total: minimum 10, maximum 15 queries`;

  try {
    const raw = await callExtractionLLM(prompt);

    let cleaned = raw.trim();
    if (cleaned.startsWith("```json")) cleaned = cleaned.replace(/^```json/, "").replace(/```$/, "").trim();
    else if (cleaned.startsWith("```")) cleaned = cleaned.replace(/^```/, "").replace(/```$/, "").trim();

    const extracted = JSON.parse(cleaned);

    // Clean searchQueries: remove comment strings (lines starting with ---)
    let queries = Array.isArray(extracted.searchQueries) ? extracted.searchQueries : [];
    queries = queries
      .filter((q) => typeof q === "string" && !q.startsWith("---") && q.trim().length > 3)
      .map((q) => q.trim())
      .slice(0, 15);

    // If LLM returned fewer than 5, augment with fallbacks
    if (queries.length < 5) {
      queries = [...queries, ...buildFallbackQueries(industry, challenges)].slice(0, 15);
    }

    const metadataFilters = extracted.metadataFilters || {
      industry: extracted.industry || industry,
      department: extracted.department || "Operations",
      industryConfidence: 70
    };

    return {
      industry: extracted.industry || industry || "General Enterprise",
      department: extracted.department || "Operations",
      businessFunctions: Array.isArray(extracted.businessFunctions) ? extracted.businessFunctions : [],
      painPoints: Array.isArray(extracted.painPoints) ? extracted.painPoints : [challenges],
      businessGoals: Array.isArray(extracted.businessGoals) ? extracted.businessGoals : [],
      currentSystems: Array.isArray(extracted.currentSystems) ? extracted.currentSystems : [],
      technologies: Array.isArray(extracted.technologies) ? extracted.technologies : [],
      metadataFilters,
      searchQueries: queries
    };
  } catch (err) {
    console.error("[ContextExtraction] Parse error, using fallback context:", err.message);
    return {
      industry: industry || "General Enterprise",
      department: "Operations",
      businessFunctions: [],
      painPoints: [challenges],
      businessGoals: ["Improve operational efficiency", "Reduce manual effort", "Lower operational costs"],
      currentSystems: [],
      technologies: ["AI", "Automation", "Machine Learning"],
      metadataFilters: {
        industry: industry || "General Enterprise",
        department: "Operations",
        industryConfidence: 60
      },
      searchQueries: buildFallbackQueries(industry, challenges)
    };
  }
}

module.exports = { extractBusinessContext };
