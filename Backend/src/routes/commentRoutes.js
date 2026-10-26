const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const { createComment, getComments, deleteComment } = require("../controllers/commentController");


router.post("/posts/:postId/comments", authMiddleware, createComment);
router.post("/posts/:postId/comment", authMiddleware, createComment);

router.get("/posts/:postId/comments", authMiddleware, getComments);
router.get("/posts/:postId/comment", authMiddleware, getComments);

router.delete("/posts/:postId/comments/:commentId", authMiddleware, deleteComment);
router.delete("/posts/:postId/comment/:commentId", authMiddleware, deleteComment);

module.exports = router;