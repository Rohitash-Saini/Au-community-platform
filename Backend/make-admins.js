const mongoose = require("mongoose");
const User = require("./src/models/user");
const bcrypt = require("bcryptjs");

mongoose
  .connect("mongodb://127.0.0.1:27017/au_community") // Adjust connection string if needed
  .then(async () => {
    console.log("Connected to MongoDB.");
    
    // Find up to two existing users
    let users = await User.find({ role: { $ne: 'admin' } }).limit(2);
    
    if (users.length === 0) {
      console.log("No non-admin users found to update. Checking total users...");
      const total = await User.countDocuments();
      if (total === 0) {
        console.log("Creating 2 default admin users...");
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash("admin123", salt);
        await User.create([
          { name: "Admin One", email: "admin1@au.edu", password: passwordHash, role: "admin", batch: "Batch 2024", about: "Admin 1" },
          { name: "Admin Two", email: "admin2@au.edu", password: passwordHash, role: "admin", batch: "Batch 2024", about: "Admin 2" }
        ]);
        console.log("Created 2 default admin users.");
      } else {
        const admins = await User.find({ role: 'admin' });
        console.log(`Found ${admins.length} existing admin users.`);
      }
    } else {
      for (const user of users) {
        user.role = 'admin';
        await user.save();
        console.log(`Updated user ${user.email} to admin.`);
      }
    }
    
    mongoose.connection.close();
  })
  .catch((err) => {
    console.error("Connection error", err);
    mongoose.connection.close();
  });
