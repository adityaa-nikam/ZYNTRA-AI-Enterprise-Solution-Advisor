const express = require("express");
const router = express.Router();
const {
  saveReport,
  getReports,
  getReportById,
  updateReportTitle,
  duplicateReport,
  toggleBookmark,
  generateShareLink,
  getSharedReport,
  deleteReport,
} = require("../controllers/reportController");
const { protect } = require("../middleware/authMiddleware");

const optionalProtect = (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    return protect(req, res, next);
  }
  next();
};

router.post("/save", optionalProtect, saveReport);
router.get("/", optionalProtect, getReports);
router.get("/share/:shareToken", getSharedReport); // Completely public
router.get("/:id", optionalProtect, getReportById);
router.post("/:id/share", optionalProtect, generateShareLink);
router.put("/:id/title", optionalProtect, updateReportTitle);
router.post("/:id/duplicate", optionalProtect, duplicateReport);
router.patch("/:id/bookmark", optionalProtect, toggleBookmark);
router.delete("/:id", optionalProtect, deleteReport);

module.exports = router;