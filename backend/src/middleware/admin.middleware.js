export const adminOnly = async (req, res, next) => {
  try {
    // Check if user exists and has admin role
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Access denied. Admin privileges required.' 
      });
    }
    next();
  } catch (error) {
    res.status(500).json({ 
      error: 'Admin authorization failed',
      message: error.message 
    });
  }
}; 