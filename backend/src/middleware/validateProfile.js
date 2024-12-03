import User from '../models/user.model.js';

export const validateProfile = async (req, res, next) => {
  try {
    // Just pass through without validation
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; 