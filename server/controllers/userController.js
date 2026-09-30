const User = require('../models/User');
const { sendResponse, sendError } = require('../utils/responseHandler');

/**
 * Optimization: Lean query with negative selection to protect sensitive fields.
 */
const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Select all fields EXCEPT password, firebaseUid, and __v
    const user = await User.findById(userId)
      .select("-password -firebaseUid -__v")
      .lean(); // Optimization: returns plain object for performance

    if (!user) return sendError(res, 404, "User not found");

    // Fetch wishlistCount for navbar badge
    const Wishlist = require('../models/Wishlist');
    const wishlist = await Wishlist.findOne({ user: userId }).lean();
    user.wishlistCount = wishlist ? wishlist.items.length : 0;

    return sendResponse(res, 200, user);
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

module.exports = {
  getUserProfile
};
