const sellerService = require("./seller.service");

class SellerController {
  async getProducts(req, res) {
    try {
      const { category, search } = req.query;
      const userId = req.user.userId;

      const products = await sellerService.getProducts(userId, {
        category,
        search,
      });

      res.json({
        success: true,
        data: products,
      });
    } catch (error) {
      console.error("💥 Get products error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch products",
      });
    }
  }

  async createProduct(req, res) {
    try {
      const userId = req.user.userId;
      const productData = req.body;

      // Validate required fields
      if (
        !productData.name ||
        !productData.price ||
        !productData.stock ||
        !productData.categoryId
      ) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: name, price, stock, categoryId",
        });
      }

      const product = await sellerService.createProduct(userId, productData);

      res.status(201).json({
        success: true,
        message: "Product created successfully",
        data: product,
      });
    } catch (error) {
      console.error("💥 Create product error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to create product",
      });
    }
  }

  async updateProduct(req, res) {
    try {
      const { productId } = req.params;
      const userId = req.user.userId;
      const updateData = req.body;

      const product = await sellerService.updateProduct(
        productId,
        userId,
        updateData
      );

      res.json({
        success: true,
        message: "Product updated successfully",
        data: product,
      });
    } catch (error) {
      console.error("💥 Update product error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to update product",
      });
    }
  }

  async deleteProduct(req, res) {
    try {
      const { productId } = req.params;
      const userId = req.user.userId;

      await sellerService.deleteProduct(productId, userId);

      res.json({
        success: true,
        message: "Product deleted successfully",
      });
    } catch (error) {
      console.error("💥 Delete product error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to delete product",
      });
    }
  }

  async getSellerOrders(req, res) {
    try {
      const { status, search } = req.query;
      const userId = req.user.userId;

      const orders = await sellerService.getSellerOrders(userId, {
        status,
        search,
      });

      res.json({
        success: true,
        data: orders,
      });
    } catch (error) {
      console.error("💥 Get seller orders error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch orders",
      });
    }
  }

  async updateOrderStatus(req, res) {
    try {
      const { orderId } = req.params;
      const userId = req.user.userId;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: "Status is required",
        });
      }

      const validStatuses = [
        "PENDING",
        "PROCESSING",
        "SHIPPED",
        "COMPLETED",
        "CANCELLED",
      ];
      if (!validStatuses.includes(status.toUpperCase())) {
        return res.status(400).json({
          success: false,
          message: "Invalid status",
        });
      }

      const order = await sellerService.updateOrderStatus(
        orderId,
        userId,
        status
      );

      res.json({
        success: true,
        message: "Order status updated successfully",
        data: order,
      });
    } catch (error) {
      console.error("💥 Update order status error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to update order status",
      });
    }
  }

  async getSalesAnalytics(req, res) {
    try {
      const userId = req.user.userId;
      const analytics = await sellerService.getSalesAnalytics(userId);

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      console.error("💥 Get sales analytics error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch sales analytics",
      });
    }
  }

  // Inquiries
  async getInquiries(req, res) {
    try {
      const userId = req.user.userId;
      const { status } = req.query;
      const data = await sellerService.getInquiries(userId, { status });
      res.json({ success: true, data });
    } catch (error) {
      console.error("💥 Get seller inquiries error:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to fetch inquiries" });
    }
  }

  async replyToInquiry(req, res) {
    try {
      const sellerId = req.user.userId;
      const { inquiryId } = req.params;
      const { response } = req.body;
      if (!response) {
        return res
          .status(400)
          .json({ success: false, message: "Response is required" });
      }
      const updated = await sellerService.replyToInquiry(
        inquiryId,
        sellerId,
        response
      );
      res.json({ success: true, message: "Reply sent", data: updated });
    } catch (error) {
      console.error("💥 Reply to inquiry error:", error);
      res
        .status(500)
        .json({ success: false, message: error.message || "Failed to reply" });
    }
  }

  async getVerificationStatus(req, res) {
    try {
      const userId = req.user.userId;
      const status = await sellerService.getVerificationStatus(userId);

      res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      console.error("💥 Get verification status error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch verification status",
      });
    }
  }

  async submitVerification(req, res) {
    try {
      const userId = req.user.userId;
      const documents = req.body;

      if (!documents || Object.keys(documents).length === 0) {
        return res.status(400).json({
          success: false,
          message: "No documents provided",
        });
      }

      const result = await sellerService.submitVerification(userId, documents);

      res.json({
        success: true,
        message: "Verification documents submitted successfully",
        data: result,
      });
    } catch (error) {
      console.error("💥 Submit verification error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to submit verification documents",
      });
    }
  }

  async getCompanyProfile(req, res) {
    try {
      const userId = req.user.userId;
      const company = await sellerService.getCompanyProfile(userId);

      res.json({
        success: true,
        data: company,
      });
    } catch (error) {
      console.error("💥 Get company profile error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch company profile",
      });
    }
  }

  async updateCompanyProfile(req, res) {
    try {
      const userId = req.user.userId;
      const profileData = req.body;

      const company = await sellerService.updateCompanyProfile(
        userId,
        profileData
      );

      res.json({
        success: true,
        message: "Company profile updated successfully",
        data: company,
      });
    } catch (error) {
      console.error("💥 Update company profile error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update company profile",
      });
    }
  }

  // RFQ quick access (for dashboard)
  async getAvailableRFQs(req, res) {
    try {
      const userId = req.user.userId;
      const { category } = req.query;
      const rfqs = await sellerService.getAvailableRFQs(userId, { category });

      res.json({
        success: true,
        data: rfqs,
      });
    } catch (error) {
      console.error("💥 Get available RFQs error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch available RFQs",
      });
    }
  }

  async getMyQuotes(req, res) {
    try {
      const userId = req.user.userId;
      const quotes = await sellerService.getMyQuotes(userId);

      res.json({
        success: true,
        data: quotes,
      });
    } catch (error) {
      console.error("💥 Get my quotes error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch quotes",
      });
    }
  }
}

module.exports = new SellerController();
