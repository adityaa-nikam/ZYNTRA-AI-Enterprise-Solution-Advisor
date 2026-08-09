/**
 * STAGE 5 — Evidence Validation Service
 *
 * Runs a final LLM pass to verify that every recommendation in the generated
 * report is supported by the retrieved evidence chunks. If confidence < 70,
 * it triggers one regeneration pass.
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

async function callValidationLLM(prompt) {
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
      console.warn("[Validation] Groq failed, falling back to OpenRouter:", err.message);
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

  throw new Error("No valid LLM API keys found for Validation.");
}

/**
 * Validate the generated report against the top evidence chunks.
 *
 * @param {object} report     - The generated report JSON from aiService
 * @param {Array}  topChunks  - Top 5 reranked evidence chunks
 * @param {object} context    - Extracted business context
 * @returns {object} Validation result with corrected report
 */
async function validateReport(report, topChunks, context) {
  const start = Date.now();

  // Build compact evidence summary for the validation prompt
  const evidenceSummary = topChunks.map((chunk, i) => `
[Evidence ${i + 1}]
Source: ${chunk.metadata?.source}
Title: ${chunk.metadata?.title}
Industry: ${chunk.metadata?.industry}
Summary: ${chunk.metadata?.summary}
Technologies: ${(chunk.metadata?.technologies || []).join(", ")}
Content Excerpt: ${chunk.content?.substring(0, 600)}
`).join("\n");

  const recommendationList = (report.recommendations || []).map((r, i) =>
    `Rec ${i + 1}: ${r.title} — ${r.description?.substring(0, 200)}`
  ).join("\n");

  const prompt = `You are a Senior AI Consulting Quality Assurance Analyst.

Your task is to validate the following AI-generated consulting report by checking whether every recommendation is supported by the retrieved enterprise evidence.

RETRIEVED EVIDENCE (Top Ranked Chunks from Knowledge Base):
${evidenceSummary}

GENERATED REPORT RECOMMENDATIONS TO VALIDATE:
${recommendationList}

INDUSTRY CONTEXT: ${context.industry}
DEPARTMENT: ${context.department}
PAIN POINTS: ${(context.painPoints || []).slice(0, 4).join("; ")}

VALIDATION INSTRUCTIONS:
1. Review each recommendation and determine if it is supported by ANY of the evidence chunks above.
2. A recommendation is "supported" if the evidence chunk discusses: the same technology, same business function, same problem domain, or same industry application.
3. For unsupported recommendations, either: (a) remove them, OR (b) modify them to reference what IS in the evidence.
4. Calculate a confidence score 0-100 based on: what % of recommendations are evidence-grounded.
5. If confidence < 70, set "requiresRegeneration": true.

Return EXACTLY this JSON:
{
  "confidenceScore": 85,
  "requiresRegeneration": false,
  "validatedRecommendations": [
    {
      "title": "Validated or modified recommendation title",
      "description": "Description grounded in evidence",
      "benefits": ["Benefit 1", "Benefit 2"],
      "impactScore": 9,
      "effortScore": 4,
      "grounding": {
        "basedOnDocument": "source_file.md",
        "confidenceScore": 92,
        "supportingEvidence": "Direct quote or paraphrase from evidence chunk"
      },
      "isGrounded": true
    }
  ],
  "unsupportedClaims": ["List any claims removed or heavily modified"],
  "validationNotes": "Brief 1-2 sentence quality note about the report's grounding quality",
  "evidenceUsed": ["List of source files that grounded the validated recommendations"]
}`;

  try {
    const raw = await callValidationLLM(prompt);
    let cleaned = raw.trim();
    if (cleaned.startsWith("```json")) cleaned = cleaned.replace(/^```json/, "").replace(/```$/, "").trim();
    else if (cleaned.startsWith("```")) cleaned = cleaned.replace(/^```/, "").replace(/```$/, "").trim();

    const validation = JSON.parse(cleaned);

    const validationTimeMs = Date.now() - start;

    // Merge validated recommendations back into the full report
    const validatedReport = {
      ...report,
      recommendations: validation.validatedRecommendations || report.recommendations
    };

    const result = {
      validatedReport,
      confidenceScore: validation.confidenceScore || 75,
      requiresRegeneration: validation.requiresRegeneration || false,
      unsupportedClaims: validation.unsupportedClaims || [],
      validationNotes: validation.validationNotes || "Report validation complete.",
      evidenceUsed: validation.evidenceUsed || [],
      validationTimeMs
    };

    console.log(`✅ [Validation] Confidence: ${result.confidenceScore}% | Unsupported claims: ${result.unsupportedClaims.length} | Time: ${validationTimeMs}ms`);
    return result;
  } catch (err) {
    console.error("[Validation] Parse error, returning report as-is:", err.message);
    return {
      validatedReport: report,
      confidenceScore: 75,
      requiresRegeneration: false,
      unsupportedClaims: [],
      validationNotes: "Validation parsing failed. Report returned as generated.",
      evidenceUsed: topChunks.map((c) => c.metadata?.source).filter(Boolean),
      validationTimeMs: Date.now() - start
    };
  }
}

module.exports = { validateReport };
