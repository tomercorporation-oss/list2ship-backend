const rfqService = require("./rfq.service");

class RFQController {
  // ========== BUYER ENDPOINTS ==========

  async getBuyerRFQs(req, res) {
    try {
      const userId = req.user.userId;
      const { status, search } = req.query;

      const rfqs = await rfqService.getBuyerRFQs(userId, { status, search });

      res.json({
        success: true,
        data: rfqs,
      });
    } catch (error) {
      console.error("💥 Get buyer RFQs error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch RFQs",
      });
    }
  }

  async getRFQDetails(req, res) {
    try {
      const userId = req.user.userId;
      const userRole = req.user.role;
      const { rfqId } = req.params;

      const rfq = await rfqService.getRFQDetails(rfqId, userId, userRole);

      res.json({
        success: true,
        data: rfq,
      });
    } catch (error) {
      console.error("💥 Get RFQ details error:", error);
      if (error.message === "RFQ not found or access denied") {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }
      res.status(500).json({
        success: false,
        message: "Failed to fetch RFQ details",
      });
    }
  }

  async createRFQ(req, res) {
    try {
      const userId = req.user.userId;
      const rfqData = req.body;

      // Validate required fields
      const requiredFields = [
        "title",
        "description",
        "category",
        "quantity",
        "deadline",
      ];
      const missingFields = requiredFields.filter((field) => !rfqData[field]);

      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Missing required fields: ${missingFields.join(", ")}`,
        });
      }

      const rfq = await rfqService.createRFQ(userId, rfqData);

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

  async updateRFQ(req, res) {
    try {
      const userId = req.user.userId;
      const { rfqId } = req.params;
      const updateData = req.body;

      const rfq = await rfqService.updateRFQ(rfqId, userId, updateData);

      res.json({
        success: true,
        message: "RFQ updated successfully",
        data: rfq,
      });
    } catch (error) {
      console.error("💥 Update RFQ error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to update RFQ",
      });
    }
  }

  async closeRFQ(req, res) {
    try {
      const userId = req.user.userId;
      const { rfqId } = req.params;
      const { selectedQuoteId } = req.body;

      const rfq = await rfqService.closeRFQ(rfqId, userId, selectedQuoteId);

      res.json({
        success: true,
        message: "RFQ closed successfully",
        data: rfq,
      });
    } catch (error) {
      console.error("💥 Close RFQ error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to close RFQ",
      });
    }
  }

  async deleteRFQ(req, res) {
    try {
      const userId = req.user.userId;
      const { rfqId } = req.params;

      await rfqService.deleteRFQ(rfqId, userId);

      res.json({
        success: true,
        message: "RFQ deleted successfully",
      });
    } catch (error) {
      console.error("💥 Delete RFQ error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to delete RFQ",
      });
    }
  }

  // ========== SELLER ENDPOINTS ==========

  async getAvailableRFQs(req, res) {
    try {
      const userId = req.user.userId;
      const { category, search } = req.query;

      const rfqs = await rfqService.getAvailableRFQs(userId, {
        category,
        search,
      });

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

  async getSellerQuotes(req, res) {
    try {
      const userId = req.user.userId;
      const { status, search } = req.query;

      const quotes = await rfqService.getSellerQuotes(userId, {
        status,
        search,
      });

      res.json({
        success: true,
        data: quotes,
      });
    } catch (error) {
      console.error("💥 Get seller quotes error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch quotes",
      });
    }
  }

  async submitQuote(req, res) {
    try {
      const userId = req.user.userId;
      const { rfqId } = req.params;
      const quoteData = req.body;

      // Validate required fields
      const requiredFields = ["priceOffer", "moq", "deliveryTime"];
      const missingFields = requiredFields.filter((field) => !quoteData[field]);

      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Missing required fields: ${missingFields.join(", ")}`,
        });
      }

      const quote = await rfqService.submitQuote(userId, rfqId, quoteData);

      res.status(201).json({
        success: true,
        message: "Quote submitted successfully",
        data: quote,
      });
    } catch (error) {
      console.error("💥 Submit quote error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to submit quote",
      });
    }
  }

  async updateQuote(req, res) {
    try {
      const userId = req.user.userId;
      const { quoteId } = req.params;
      const updateData = req.body;

      const quote = await rfqService.updateQuote(quoteId, userId, updateData);

      res.json({
        success: true,
        message: "Quote updated successfully",
        data: quote,
      });
    } catch (error) {
      console.error("💥 Update quote error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to update quote",
      });
    }
  }

  async withdrawQuote(req, res) {
    try {
      const userId = req.user.userId;
      const { quoteId } = req.params;

      await rfqService.withdrawQuote(quoteId, userId);

      res.json({
        success: true,
        message: "Quote withdrawn successfully",
      });
    } catch (error) {
      console.error("💥 Withdraw quote error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to withdraw quote",
      });
    }
  }

  // ========== MESSAGING ENDPOINTS ==========

  async sendMessage(req, res) {
    try {
      const userId = req.user.userId;
      const userRole = req.user.role;
      const { rfqId } = req.params;
      const { quoteId, message } = req.body;

      if (!message || !message.trim()) {
        return res.status(400).json({
          success: false,
          message: "Message cannot be empty",
        });
      }

      const newMessage = await rfqService.sendMessage(
        userId,
        userRole,
        rfqId,
        quoteId,
        message
      );

      res.status(201).json({
        success: true,
        message: "Message sent successfully",
        data: newMessage,
      });
    } catch (error) {
      console.error("💥 Send message error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to send message",
      });
    }
  }

  async getMessages(req, res) {
    try {
      const userId = req.user.userId;
      const userRole = req.user.role;
      const { rfqId } = req.params;
      const { quoteId } = req.query;

      const messages = await rfqService.getMessages(
        rfqId,
        quoteId,
        userId,
        userRole
      );

      res.json({
        success: true,
        data: messages,
      });
    } catch (error) {
      console.error("💥 Get messages error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to fetch messages",
      });
    }
  }

  // ========== ADMIN ENDPOINTS ==========

  async getAllRFQs(req, res) {
    try {
      const { status, search, category } = req.query;

      const rfqs = await rfqService.getAllRFQs({ status, search, category });

      res.json({
        success: true,
        data: rfqs,
      });
    } catch (error) {
      console.error("💥 Get all RFQs error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch RFQs",
      });
    }
  }

  async getRFQAnalytics(req, res) {
    try {
      const analytics = await rfqService.getRFQAnalytics();

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      console.error("💥 Get RFQ analytics error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch RFQ analytics",
      });
    }
  }
}

module.exports = new RFQController();
