export const approveVendor = async (req, res) => {
  try {
    const { vendorId } = req.params;

    // First, check if a vendor profile already exists
    let vendor = await Vendor.findOne({ _id: vendorId });
    
    if (!vendor) {
      // If no vendor profile exists, create one using the user's ID
      vendor = await Vendor.create({
        _id: vendorId, // Use the provided vendorId
        name: "vendor", // These should come from the user profile
        email: "vendor@mail.com", // This should come from the user profile
        company: "vendor",
        status: "approved",
        settings: {
          notificationPreferences: {
            email: true,
            sms: false
          },
          defaultTestSettings: {
            maxAttempts: 1,
            validityDuration: 7
          }
        },
        subscription: {
          plan: "free"
        },
        wallet: {
          balance: 10,
          transactions: [{
            type: "credit",
            amount: 10,
            description: "Welcome bonus",
            status: "completed",
            createdAt: new Date()
          }]
        },
        approvedAt: new Date(),
        approvedBy: req.user._id
      });
    } else {
      // If vendor profile exists, update it
      vendor = await Vendor.findByIdAndUpdate(
        vendorId,
        {
          status: "approved",
          approvedAt: new Date(),
          approvedBy: req.user._id
        },
        { new: true }
      );
    }

    // Get user details to include in response
    const user = await User.findById(vendorId).select('name email');

    res.json({
      _id: vendor._id,
      name: user?.name || vendor.name,
      email: user?.email || vendor.email,
      status: vendor.status,
      approvedAt: vendor.approvedAt,
      approvedBy: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email
      }
    });

  } catch (error) {
    console.error('Error in approveVendor:', error);
    res.status(500).json({
      error: 'Failed to approve vendor',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};