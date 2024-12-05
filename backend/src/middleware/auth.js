import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import Vendor from "../models/vendor.model.js";

export const auth = async (req, res, next) => {
  // Skip authentication for login and register routes
  if (req.path.includes('/login') || req.path.includes('/register')) {
    return next();
  }

  try {
    console.log('Auth middleware - Headers:', req.headers);

    // Check if Authorization header exists and has correct format
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('Invalid Authorization header format');
      return res.status(401).json({ 
        error: 'Invalid authorization format',
        code: 'AUTH_FORMAT_INVALID'
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ 
        error: 'No authentication token provided',
        code: 'TOKEN_MISSING'
      });
    }

    // Verify token with better error handling
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Decoded token:', decoded);
    } catch (error) {
      console.log('Token verification failed:', error.message);
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          error: 'Token has expired',
          code: 'TOKEN_EXPIRED'
        });
      }
      return res.status(401).json({ 
        error: 'Invalid token',
        code: 'TOKEN_INVALID'
      });
    }

    // Find user based on role
    let user;
    try {
      if (decoded.role === 'vendor') {
        user = await Vendor.findById(decoded.id);
        console.log('Vendor lookup result:', user, 'for ID:', decoded.id);
        
        if (!user) {
          // Check if user exists in User model but not in Vendor model
          const userExists = await User.findById(decoded.id);
          if (userExists && userExists.role === 'vendor') {
            return res.status(400).json({ 
              error: 'Vendor profile not initialized. Please complete vendor registration.',
              code: 'VENDOR_NOT_INITIALIZED'
            });
          }
          return res.status(404).json({ 
            error: 'Vendor not found. Please ensure your account is registered.',
            code: 'VENDOR_NOT_FOUND'
          });
        }

        // Add status check
        if (user.status !== 'approved') {
          return res.status(403).json({ 
            error: 'Vendor account is not approved yet. Please wait for admin approval.',
            code: 'VENDOR_NOT_APPROVED',
            status: user.status
          });
        }
      } else {
        user = await User.findById(decoded.id);
      }
    } catch (error) {
      console.log('Database lookup failed:', error.message);
      return res.status(500).json({ 
        error: 'Failed to verify user',
        code: 'USER_LOOKUP_FAILED'
      });
    }

    if (!user) {
      console.log('User/Vendor not found - Token may be outdated');
      return res.status(401).json({ 
        error: 'User no longer exists',
        code: 'USER_NOT_FOUND'
      });
    }

    // Set both user data and role explicitly
    req.user = {
      ...user.toObject(),  // Convert Mongoose document to plain object
      role: decoded.role   // Explicitly set the role from the token
    };
    
    console.log('User authenticated:', user._id, 'with role:', decoded.role);
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ 
      error: 'Authentication failed',
      details: error.message,
      code: 'AUTH_FAILED'
    });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Not authorized to access this resource" });
    }
    
    next();
  };
};
