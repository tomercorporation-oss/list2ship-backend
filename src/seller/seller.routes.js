const express = require("express");
const sellerController = require("./seller.controller");
const { authenticate } = require("../auth/middleware/auth.middleware");

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Product management
router.get("/products", sellerController.getProducts);
router.post("/products", sellerController.createProduct);
router.put("/products/:productId", sellerController.updateProduct);
router.delete("/products/:productId", sellerController.deleteProduct);

// Order management
router.get("/orders", sellerController.getSellerOrders);
router.patch("/orders/:orderId/status", sellerController.updateOrderStatus);

// Analytics
router.get("/analytics", sellerController.getSalesAnalytics);

// Inquiries
router.get("/inquiries", sellerController.getInquiries);
router.post("/inquiries/:inquiryId/reply", sellerController.replyToInquiry);

// Company verification
router.get("/verification", sellerController.getVerificationStatus);
router.post("/verification", sellerController.submitVerification);

// Company profile
router.get("/company/profile", sellerController.getCompanyProfile);
router.put("/company/profile", sellerController.updateCompanyProfile);

// RFQ quick access (for dashboard - full functionality in /api/rfq)
router.get("/rfqs/available", sellerController.getAvailableRFQs);
router.get("/rfqs/my-quotes", sellerController.getMyQuotes);

module.exports = router;
