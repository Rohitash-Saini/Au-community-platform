const mongoose = require("mongoose");
const User = require("./src/models/user");

mongoose.connect("mongodb://127.0.0.1:27017/au_community").then(async () => {
  const result = await User.deleteMany({ email: { $in: ["admin1@au.edu", "admin2@au.edu"] } });
  console.log("Deleted", result.deletedCount, "admin users.");
  process.exit(0);
});
