const express = require("express");
const buyerController = require("./buyer.controller");
const { authenticate } = require("../auth/middleware/auth.middleware");

const router = express.Router();

// Public routes (no authentication required)
router.get("/rfqs/recent", buyerController.getRecentRFQs);

// All other routes require authentication
router.use(authenticate);

// Order management
router.get("/orders", buyerController.getOrders);
router.get("/orders/:orderId", buyerController.getOrderDetails);

// RFQ management
router.get("/rfqs", buyerController.getRFQs);
router.post("/rfqs", buyerController.createRFQ);

// Inquiries
router.get("/inquiries", buyerController.getInquiries);
router.post("/inquiries", buyerController.createInquiry);

// Analytics
router.get("/analytics", buyerController.getPurchaseAnalytics);

// Suppliers
router.get("/suppliers", buyerController.getSuppliers);
router.get("/suppliers/:supplierId", buyerController.getSupplierDetails);
router.post("/suppliers/save", buyerController.saveSupplier);
router.delete("/suppliers/save/:supplierId", buyerController.unsaveSupplier);

module.exports = router;
