const express = require("express");
const router = express.Router();
const { getChatHistory, sendMessage } = require("../controllers/chatController");
const { protect } = require("../middleware/authMiddleware");

// Optional protect middleware so both guests and logged in users can chat
const optionalProtect = (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    return protect(req, res, next);
  }
  next();
};

router.get("/:reportId", optionalProtect, getChatHistory);
router.post("/:reportId/message", optionalProtect, sendMessage);

module.exports = router;
