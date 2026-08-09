const express = require("express");
const router = express.Router();
const {
  getAdminAnalytics,
  getAdminUsers,
  updateUserRole,
  deleteUser
} = require("../controllers/adminController");
const { protect, authorize } = require("../middleware/authMiddleware");

// All admin routes require authentication AND Admin role
router.use(protect);
router.use(authorize("Admin"));

router.get("/analytics", getAdminAnalytics);
router.get("/users", getAdminUsers);
router.put("/users/:id/role", updateUserRole);
router.delete("/users/:id", deleteUser);

module.exports = router;
