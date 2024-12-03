import Vendor from '../models/vendor.model.js';

export const checkVendorApproval = async (req, res, next) => {
  try {
    console.log('Checking vendor approval for user:', req.user._id);
    
    const vendor = await Vendor.findOne({
      $or: [
        { email: req.user.email },
        { _id: req.user._id }
      ]
    });
    
    if (!vendor) {
      console.log('No vendor profile found for:', {
        userId: req.user._id,
        userEmail: req.user.email
      });
      return res.status(400).json({ 
        error: 'Vendor profile not initialized. Please complete vendor registration.',
        code: 'VENDOR_NOT_INITIALIZED',
        details: {
          userId: req.user._id,
          userEmail: req.user.email
        }
      });
    }

    console.log('Found vendor profile:', {
      vendorId: vendor._id,
      vendorEmail: vendor.email,
      vendorStatus: vendor.status,
      vendorName: vendor.name,
      vendorCompany: vendor.company
    });

    if (!vendor.name || !vendor.company) {
      return res.status(400).json({
        error: 'Vendor profile incomplete. Please complete all required fields.',
        code: 'VENDOR_PROFILE_INCOMPLETE',
        missingFields: {
          name: !vendor.name,
          company: !vendor.company
        }
      });
    }

    if (vendor.status !== 'approved') {
      return res.status(403).json({ 
        message: 'Vendor account is not approved yet. Please wait for admin approval.',
        status: vendor.status,
        vendorId: vendor._id
      });
    }

    req.vendor = vendor;
    next();
  } catch (error) {
    console.error('Error in checkVendorApproval:', error);
    res.status(500).json({ 
      message: 'Error checking vendor approval status',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}; 