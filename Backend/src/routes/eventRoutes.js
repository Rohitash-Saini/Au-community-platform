const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  rsvpEvent,
} = require("../controllers/eventController");

router.get(["/", ""], getEvents);
router.post(["/", ""], authMiddleware, adminMiddleware, createEvent);
router.put("/:id", authMiddleware, adminMiddleware, updateEvent);
router.delete("/:id", authMiddleware, adminMiddleware, deleteEvent);
router.post("/:id/rsvp", authMiddleware, rsvpEvent);

module.exports = router;
