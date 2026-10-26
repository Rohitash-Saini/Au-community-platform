const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  getConversation,
  sendMessage,
  getConversationsList,
  markAsRead,
} = require("../controllers/messageController");

router.get("/conversations", authMiddleware, getConversationsList);
router.get("/:userId", authMiddleware, getConversation);
router.post("/", authMiddleware, sendMessage);
router.put("/:userId/read", authMiddleware, markAsRead);

module.exports = router;
