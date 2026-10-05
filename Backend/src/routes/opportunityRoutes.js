const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const { getOpportunities, createOpportunity, deleteOpportunity } = require("../controllers/opportunityController");

router.get(["/", ""], authMiddleware, getOpportunities);
router.post(["/", ""], authMiddleware, adminMiddleware, createOpportunity);
router.delete("/:id", authMiddleware, adminMiddleware, deleteOpportunity);

module.exports = router;
