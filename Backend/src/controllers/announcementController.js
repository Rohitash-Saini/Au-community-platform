const Announcement = require("../models/announcement");
const Notification = require("../models/Notification");
const User = require("../models/user");

const getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, announcements });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const createAnnouncement = async (req, res) => {
  try {
    const announcement = new Announcement(req.body);
    await announcement.save();

    // Create notifications for all users
    try {
      const users = await User.find({}).select("_id");
      if (users.length > 0) {
        const notificationsToCreate = users.map((u) => ({
          recipient: u._id,
          sender: req.user ? req.user.userId : u._id,
          type: "announcement",
          message: `${announcement.title}${announcement.content ? ": " + announcement.content : ""}`,
          relatedId: announcement._id,
        }));
        await Notification.insertMany(notificationsToCreate);
      }
    } catch (notifErr) {
      console.error("Announcement notification error:", notifErr.message);
    }

    res.status(201).json({ success: true, announcement });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const deleteAnnouncement = async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { getAnnouncements, createAnnouncement, deleteAnnouncement };
