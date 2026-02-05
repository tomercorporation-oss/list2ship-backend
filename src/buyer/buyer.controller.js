const buyerService = require("./buyer.service");

class BuyerController {
  async getOrders(req, res) {
    try {
      const { status, search } = req.query;
      const userId = req.user.userId;

      const orders = await buyerService.getOrders(userId, { status, search });

      res.json({
        success: true,
        data: orders,
      });
    } catch (error) {
      console.error("💥 Get orders error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch orders",
      });
    }
  }

  async getOrderDetails(req, res) {
    try {
      const { orderId } = req.params;
      const userId = req.user.userId;

      const order = await buyerService.getOrderDetails(orderId, userId);

      res.json({
        success: true,
        data: order,
      });
    } catch (error) {
      console.error("💥 Get order details error:", error);
      if (error.message === "Order not found") {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }
      res.status(500).json({
        success: false,
        message: "Failed to fetch order details",
      });
    }
  }

  async getRFQs(req, res) {
    try {
      const userId = req.user.userId;
      const rfqs = await buyerService.getRFQs(userId);

      res.json({
        success: true,
        data: rfqs,
      });
    } catch (error) {
      console.error("💥 Get RFQs error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch RFQs",
      });
    }
  }

  // Public endpoint for recent RFQs (for live enquiries)
  async getRecentRFQs(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 20;
      const rfqs = await buyerService.getRecentRFQs(limit);

      res.json({
        success: true,
        data: rfqs,
      });
    } catch (error) {
      console.error("💥 Get recent RFQs error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch recent RFQs",
      });
    }
  }

  async createRFQ(req, res) {
    try {
      const userId = req.user.userId;
      const rfqData = req.body;

      // Validate required fields
      if (
        !rfqData.title ||
        !rfqData.description ||
        !rfqData.category ||
        !rfqData.quantity ||
        !rfqData.unit ||
        !rfqData.budget ||
        !rfqData.deadline
      ) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields",
        });
      }

      // Validate numeric fields
      if (
        isNaN(parseInt(rfqData.quantity)) ||
        parseInt(rfqData.quantity) <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Quantity must be a positive number",
        });
      }

      if (
        isNaN(parseFloat(rfqData.budget)) ||
        parseFloat(rfqData.budget) <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Budget must be a positive number",
        });
      }

      // Validate unit field
      if (!rfqData.unit.trim()) {
        return res.status(400).json({
          success: false,
          message: "Unit is required",
        });
      }

      const rfq = await buyerService.createRFQ(userId, rfqData);

      res.status(201).json({
        success: true,
        message: "RFQ created successfully",
        data: rfq,
      });
    } catch (error) {
      console.error("💥 Create RFQ error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create RFQ",
      });
    }
  }

  // Inquiries
  async createInquiry(req, res) {
    try {
      const userId = req.user.userId;
      const { productId, sellerId, subject, message, email, phone } = req.body;

      if (!subject || !message) {
        return res.status(400).json({
          success: false,
          message: "Subject and message are required",
        });
      }

      const inquiry = await buyerService.createInquiry(userId, {
        productId,
        sellerId,
        subject,
        message,
        email,
        phone,
      });

      res.status(201).json({
        success: true,
        message: "Inquiry sent successfully",
        data: inquiry,
      });
    } catch (error) {
      console.error("💥 Create inquiry error:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to send inquiry" });
    }
  }

  async getInquiries(req, res) {
    try {
      const userId = req.user.userId;
      const { status } = req.query;
      const list = await buyerService.getInquiries(userId, { status });
      res.json({ success: true, data: list });
    } catch (error) {
      console.error("💥 Get inquiries error:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to fetch inquiries" });
    }
  }

  async getPurchaseAnalytics(req, res) {
    try {
      const userId = req.user.userId;
      const analytics = await buyerService.getPurchaseAnalytics(userId);

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      console.error("💥 Get analytics error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch analytics",
      });
    }
  }

  async getSuppliers(req, res) {
    try {
      const { search, category } = req.query;
      const suppliers = await buyerService.getSuppliers({ search, category });

      res.json({
        success: true,
        data: suppliers,
      });
    } catch (error) {
      console.error("💥 Get suppliers error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch suppliers",
      });
    }
  }

  async getSupplierDetails(req, res) {
    try {
      const { supplierId } = req.params;
      const supplier = await buyerService.getSupplierDetails(supplierId);

      res.json({
        success: true,
        data: supplier,
      });
    } catch (error) {
      console.error("💥 Get supplier details error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch supplier details",
      });
    }
  }

  async saveSupplier(req, res) {
    try {
      const userId = req.user.userId;
      const { supplierId } = req.body;

      await buyerService.saveSupplier(userId, supplierId);

      res.json({
        success: true,
        message: "Supplier saved successfully",
      });
    } catch (error) {
      console.error("💥 Save supplier error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to save supplier",
      });
    }
  }

  async unsaveSupplier(req, res) {
    try {
      const userId = req.user.userId;
      const { supplierId } = req.params;

      await buyerService.unsaveSupplier(userId, supplierId);

      res.json({
        success: true,
        message: "Supplier removed from saved list",
      });
    } catch (error) {
      console.error("💥 Unsave supplier error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to remove supplier",
      });
    }
  }
}

module.exports = new BuyerController();
