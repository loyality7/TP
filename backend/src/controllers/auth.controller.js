import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import nodemailer from 'nodemailer'; // You'll need to npm install nodemailer

export const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Limit each IP to 3 requests per windowMs
  message: {
    error: "Too many password reset attempts. Please try again after 15 minutes"
  }
});

export const register = async (req, res) => {
  try {
    const { name, username, email, password, role = "user" } = req.body;
    
    console.log('Registration attempt:', {
      email,
      username,
      name,
      role
    });

    // Check if email already exists (case insensitive)
    const existingUser = await User.findOne({ 
      email: { $regex: new RegExp(`^${email}$`, 'i') } 
    });
    
    if (existingUser) {
      console.log('Email already exists:', email);
      return res.status(400).json({ 
        error: "Email already registered. Please use a different email or login instead.",
        field: "email"
      });
    }

    // Check if username already exists (case insensitive)
    const existingUsername = await User.findOne({ 
      username: { $regex: new RegExp(`^${username}$`, 'i') }
    });
    if (existingUsername) {
      console.log('Username already exists:', username);
      return res.status(400).json({ 
        error: "Username already taken. Please choose a different username.",
        field: "username"
      });
    }

    // Validate role
    if (role === "admin") {
      return res.status(400).json({ 
        error: "Admin registration is not allowed through this endpoint" 
      });
    }

    if (role !== "user" && role !== "vendor") {
      return res.status(400).json({ 
        error: "Invalid role. Only 'user' or 'vendor' roles are allowed" 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, username, email, password: hashedPassword, role });
    console.log('User created successfully:', user._id);
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
    res.json({ token, user: { id: user._id, name, username, email, role } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { login, password } = req.body;
    const user = await User.findOne({
      $or: [
        { email: login },
        { username: login }
      ]
    });
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
    res.json({ token, user: { id: user._id, name: user.name, username: user.username, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    // In a real application, you might want to invalidate the token
    // For now, we'll just send a success response
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      // Use a vague message for security
      return res.json({ 
        message: "If a user with that email exists, a password reset link will be sent." 
      });
    }

    // Generate a secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutes

    await user.save();

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    // Email configuration
    const transporter = nodemailer.createTransport({
      // Configure your email provider here
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: 'Password Reset Request',
      html: `
        <h1>Password Reset Request</h1>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>This link will expire in 15 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
    };

    await transporter.sendMail(mailOptions);

    // Send a vague response for security
    res.json({ 
      message: "If a user with that email exists, a password reset link will be sent." 
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ 
      error: "There was an error sending the password reset email. Please try again later." 
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    // Validate password
    if (!password || password.length < 8) {
      return res.status(400).json({ 
        error: "Password must be at least 8 characters long" 
      });
    }
    
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ 
        error: "Password reset token is invalid or has expired" 
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Send confirmation email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: 'Password Changed Successfully',
      html: `
        <h1>Password Changed</h1>
        <p>Your password has been changed successfully.</p>
        <p>If you didn't make this change, please contact support immediately.</p>
      `
    });

    res.json({ 
      message: "Password has been reset successfully. You can now log in with your new password." 
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ 
      error: "There was an error resetting your password. Please try again later." 
    });
  }
};

// Temporary debug endpoint - REMOVE IN PRODUCTION
export const debugUsers = async (req, res) => {
  try {
    const users = await User.find({}, 'email username');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
