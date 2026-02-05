const companyService = require("./company.service");

class CompanyController {
  async getCompanyProfile(req, res) {
    try {
      const userId = req.user.userId;
      const profile = await companyService.getCompanyProfile(userId);

      res.json({
        success: true,
        data: profile,
      });
    } catch (error) {
      console.error("💥 Get company profile error:", error);
      res.status(error.message === "Company not found" ? 404 : 500).json({
        success: false,
        message: error.message || "Failed to fetch company profile",
      });
    }
  }

  async updateCompanyProfile(req, res) {
    try {
      const userId = req.user.userId;
      const profileData = req.body;

      const updatedProfile = await companyService.updateCompanyProfile(
        userId,
        profileData
      );

      res.json({
        success: true,
        message: "Company profile updated successfully",
        data: updatedProfile,
      });
    } catch (error) {
      console.error("💥 Update company profile error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to update company profile",
      });
    }
  }

  async requestVerification(req, res) {
    try {
      const userId = req.user.userId;
      const result = await companyService.requestVerification(userId);

      res.json({
        success: true,
        message: "Verification request submitted",
        data: result,
      });
    } catch (error) {
      console.error("💥 Request verification error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to submit verification request",
      });
    }
  }

  async getDashboardStats(req, res) {
    try {
      const userId = req.user.userId;
      const stats = await companyService.getDashboardStats(userId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("💥 Get dashboard stats error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch dashboard stats",
      });
    }
  }
}

module.exports = new CompanyController();
