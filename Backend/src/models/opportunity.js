const mongoose = require("mongoose");

const opportunitySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    company: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["Internship", "Job", "Event"],
      default: "Internship",
    },
    applications: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["Active", "Closed"],
      default: "Active",
    },
    description: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Opportunity", opportunitySchema);
