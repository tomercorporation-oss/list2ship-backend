const express = require("express");
const rfqController = require("./rfq.controller");
const { authenticate } = require("../auth/middleware/auth.middleware");

const router = express.Router();

// All RFQ routes require authentication
router.use(authenticate);

// ========== BUYER ROUTES ==========
// Buyers can create and manage their own RFQs
router.get("/buyer/rfqs", rfqController.getBuyerRFQs);
router.get("/buyer/rfqs/:rfqId", rfqController.getRFQDetails);
router.post("/buyer/rfqs", rfqController.createRFQ);
router.put("/buyer/rfqs/:rfqId", rfqController.updateRFQ);
router.post("/buyer/rfqs/:rfqId/close", rfqController.closeRFQ);
router.delete("/buyer/rfqs/:rfqId", rfqController.deleteRFQ);

// ========== SELLER ROUTES ==========
// Sellers can view available RFQs and submit quotes
router.get("/seller/available", rfqController.getAvailableRFQs);
router.get("/seller/quotes", rfqController.getSellerQuotes);
router.post("/seller/rfqs/:rfqId/quote", rfqController.submitQuote);
router.put("/seller/quotes/:quoteId", rfqController.updateQuote);
router.delete("/seller/quotes/:quoteId", rfqController.withdrawQuote);

// ========== MESSAGING ROUTES ==========
// Both buyers and sellers can send messages
router.post("/rfqs/:rfqId/messages", rfqController.sendMessage);
router.get("/rfqs/:rfqId/messages", rfqController.getMessages);

// ========== ADMIN ROUTES ==========
// Admin can view all RFQs and analytics
router.get("/admin/rfqs", rfqController.getAllRFQs);
router.get("/admin/analytics", rfqController.getRFQAnalytics);

module.exports = router;
