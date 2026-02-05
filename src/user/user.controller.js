const userService = require("./user.service");

class UserController {
  async getUserProfile(req, res) {
    try {
      const userId = req.user.userId;
      const profile = await userService.getUserProfile(userId);

      res.json({
        success: true,
        data: profile,
      });
    } catch (error) {
      console.error("💥 Get user profile error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch user profile",
      });
    }
  }

  async updateUserProfile(req, res) {
    try {
      const userId = req.user.userId;
      const profileData = req.body;

      const updatedProfile = await userService.updateUserProfile(
        userId,
        profileData
      );

      res.json({
        success: true,
        message: "Profile updated successfully",
        data: updatedProfile,
      });
    } catch (error) {
      console.error("💥 Update user profile error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to update user profile",
      });
    }
  }

  async verifyEmail(req, res) {
    try {
      const userId = req.user.userId;
      const result = await userService.verifyEmail(userId);

      res.json({
        success: true,
        message: "Verification email sent",
        data: result,
      });
    } catch (error) {
      console.error("💥 Verify email error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to send verification email",
      });
    }
  }

  async verifyPhone(req, res) {
    try {
      const userId = req.user.userId;
      const result = await userService.verifyPhone(userId);

      res.json({
        success: true,
        message: "Verification SMS sent",
        data: result,
      });
    } catch (error) {
      console.error("💥 Verify phone error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to send verification SMS",
      });
    }
  }
}

module.exports = new UserController();
