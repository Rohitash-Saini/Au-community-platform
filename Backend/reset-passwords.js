const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./src/models/user");

mongoose.connect("mongodb://127.0.0.1:27017/au_community").then(async () => {
  try {
    const hash = await bcrypt.hash("admin123", 10);
    await User.updateMany(
      { email: { $in: ["admin1@au.edu", "admin2@au.edu"] } },
      { password: hash }
    );
    console.log("Updated passwords for admins to admin123. Hash is", hash);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
});
