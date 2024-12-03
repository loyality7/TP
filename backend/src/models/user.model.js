import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["admin", "vendor", "user"], default: "user" },
  createdAt: { type: Date, default: Date.now },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  phone: String,
  education: [{
    institution: String,
    degree: String,
    field: String,
    year: Number
  }],
  experience: [{
    company: String,
    position: String,
    startDate: Date,
    endDate: Date,
    current: Boolean,
    description: String
  }],
  skills: [{
    name: String,
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert']
    },
    verified: {
      type: Boolean,
      default: false
    }
  }],
  preferences: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    testReminders: {
      type: Boolean,
      default: true
    }
  }
});

// Create initial admin user if none exists
userSchema.statics.createDefaultAdmin = async function() {
  try {
    console.log("Checking for existing admin...");
    const adminExists = await this.findOne({ 
      $or: [
        { email: "nexteradmin@gmail.com" },
        { username: "admin" }
      ]
    });
    
    if (!adminExists) {
      console.log("No admin found, creating default admin...");
      const hashedPassword = await bcrypt.hash("Nexter123", 10);
      
      const adminUser = await this.create({
        name: "Admin User",
        username: "admin",
        email: "nexteradmin@gmail.com",
        password: hashedPassword,
        role: "admin"
      });
      
      console.log("Default admin user created successfully");
      return adminUser;
    } else {
      console.log("Admin user already exists");
      return adminExists;
    }
  } catch (error) {
    console.error("Error creating default admin:", error);
    throw error;
  }
};

export default mongoose.model("User", userSchema);

