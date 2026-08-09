/**
 * Analysis Controller
 *
 * Exposes two endpoints:
 *   POST /analyze        — Standard JSON response (backward compatible)
 *   POST /analyze/stream — Server-Sent Events for real-time progress display
 *
 * Both call the same analyzeBusinessData orchestrator. The SSE endpoint
 * sends progress messages as they happen, then sends the final report.
 */

const { analyzeBusinessData } = require("../services/analysisService");

// ─── Standard JSON endpoint (backward compatible) ────────────────────────────
const analyzeBusiness = async (req, res) => {
  try {
    const formData = req.body;
    const analysisResult = await analyzeBusinessData(formData);
    res.json(analysisResult);
  } catch (error) {
    console.error("Analysis Controller Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error"
    });
  }
};

// ─── SSE streaming endpoint ───────────────────────────────────────────────────
const analyzeBusinessStream = async (req, res) => {
  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.flushHeaders();

  // Helper to send an SSE event
  const sendEvent = (eventType, data) => {
    try {
      res.write(`event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`);
      // Force flush if available (Node 18+)
      if (res.flush) res.flush();
    } catch (e) {
      // Client disconnected — ignore
    }
  };

  // Progress callback — called by orchestrator at each stage
  const onProgress = (message) => {
    sendEvent("progress", { message, timestamp: Date.now() });
  };

  try {
    const formData = req.body;

    // Run the full pipeline
    const analysisResult = await analyzeBusinessData(formData, onProgress);

    // Send the final result
    sendEvent("done", analysisResult);
  } catch (error) {
    console.error("Analysis Stream Error:", error);
    sendEvent("error", { message: error.message || "Analysis failed" });
  } finally {
    res.end();
  }
};

module.exports = {
  analyzeBusiness,
  analyzeBusinessStream
};