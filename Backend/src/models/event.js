const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ["Dandiya", "Tournament", "Hackathon", "Cultural", "Sports", "Tech", "Workshop", "General"],
      default: "General",
    },
    eventDate: {
      type: String,
      default: "",
    },
    eventTime: {
      type: String,
      default: "",
    },
    location: {
      type: String,
      default: "AU Campus",
    },
    organizer: {
      type: String,
      default: "AU Community",
    },
    description: {
      type: String,
      default: "",
    },
    image: {
      type: String,
      default: "",
    },
    rsvps: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Event", eventSchema);
