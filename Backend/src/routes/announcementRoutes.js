const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const { getAnnouncements, createAnnouncement, deleteAnnouncement } = require("../controllers/announcementController");

router.get(["/", ""], authMiddleware, getAnnouncements);
router.post(["/", ""], authMiddleware, adminMiddleware, createAnnouncement);
router.delete("/:id", authMiddleware, adminMiddleware, deleteAnnouncement);

module.exports = router;
