const Opportunity = require("../models/opportunity");

const getOpportunities = async (req, res) => {
  try {
    const opportunities = await Opportunity.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, opportunities });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const createOpportunity = async (req, res) => {
  try {
    const opportunity = new Opportunity(req.body);
    await opportunity.save();
    res.status(201).json({ success: true, opportunity });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const deleteOpportunity = async (req, res) => {
  try {
    await Opportunity.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { getOpportunities, createOpportunity, deleteOpportunity };
