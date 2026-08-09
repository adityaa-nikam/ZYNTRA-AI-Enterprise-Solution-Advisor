const express = require("express");
const router = express.Router();
const {
  searchKnowledgeBase,
  testSearchKnowledgeBase,
  uploadDocument,
  reindexAll
} = require("../controllers/ragController");
const { protect, authorize } = require("../middleware/authMiddleware");

// Public similarity search endpoints
router.post("/search", searchKnowledgeBase);
router.post("/test-search", testSearchKnowledgeBase);

// Admin-only document upload & re-indexing
router.post("/upload", protect, authorize("Admin"), uploadDocument);
router.post("/index", protect, authorize("Admin"), reindexAll);

module.exports = router;
