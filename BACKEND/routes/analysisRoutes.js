const express = require("express");
const router = express.Router();

const { analyzeBusiness, analyzeBusinessStream } = require("../controllers/analysisController");

// Standard JSON response (backward compatible — used by existing AssessmentForm)
router.post("/analyze", analyzeBusiness);

// SSE streaming route — real-time progress events
router.post("/analyze/stream", analyzeBusinessStream);

module.exports = router;