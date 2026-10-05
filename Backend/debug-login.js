const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./src/models/user");

mongoose.connect("mongodb://127.0.0.1:27017/au_community").then(async () => {
  // Step 1: Get the admin user
  const user = await User.findOne({ email: "admin1@au.edu" });
  console.log("User found:", user ? "YES" : "NO");
  if (user) {
    console.log("Email:", user.email);
    console.log("Stored hash:", user.password);
    console.log("Hash length:", user.password.length);
    
    // Step 2: Compare password
    const result = await bcrypt.compare("admin123", user.password);
    console.log("bcrypt.compare result:", result);
    
    // Step 3: If still false, rehash and update
    if (!result) {
      console.log("\n--- Password mismatch! Fixing now... ---");
      const newHash = await bcrypt.hash("admin123", 10);
      console.log("New hash:", newHash);
      console.log("New hash length:", newHash.length);
      
      // Use updateOne to bypass any middleware
      await User.updateOne(
        { email: "admin1@au.edu" },
        { $set: { password: newHash } }
      );
      
      // Verify
      const updated = await User.findOne({ email: "admin1@au.edu" });
      console.log("Updated hash:", updated.password);
      const verify = await bcrypt.compare("admin123", updated.password);
      console.log("Verify after update:", verify);
    }
  }
  
  process.exit(0);
});
