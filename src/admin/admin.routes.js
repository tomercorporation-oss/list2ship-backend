const express = require("express");
const router = express.Router();
const adminController = require("./admin.controller");
const { adminAuth, superAdminAuth } = require("./middleware/admin.middleware");

// Authentication
router.post("/login", adminController.login);

// Dashboard
router.get("/dashboard/stats", adminAuth, adminController.getDashboardStats);

// Seller Management
router.get("/sellers", adminAuth, adminController.getAllSellers);
router.get("/sellers/:id", adminAuth, adminController.getSellerDetails);
router.patch(
  "/sellers/:id/status",
  adminAuth,
  adminController.updateSellerStatus
);
router.post("/sellers/:id/approve", adminAuth, adminController.approveSeller);
router.delete("/sellers/:id", adminAuth, adminController.deleteSeller);

// Product Management
router.get("/products", adminAuth, adminController.getAllProducts);
router.patch(
  "/products/:id/status",
  adminAuth,
  adminController.updateProductStatus
);
router.delete("/products/:id", adminAuth, adminController.deleteProduct);

// Category Management
router.get("/categories", adminAuth, adminController.getAllCategories);
router.post("/categories", adminAuth, adminController.createCategory);
router.put("/categories/:id", adminAuth, adminController.updateCategory);
router.delete("/categories/:id", adminAuth, adminController.deleteCategory);

// Buyer Management
router.get("/buyers", adminAuth, adminController.getAllBuyers);
router.get("/buyers/:id", adminAuth, adminController.getBuyerDetails);
router.patch(
  "/buyers/:id/status",
  adminAuth,
  adminController.updateBuyerStatus
);

// Inquiry Management
router.get("/inquiries", adminAuth, adminController.getAllInquiries);
router.patch("/inquiries/:id", adminAuth, adminController.updateInquiryStatus);
router.delete("/inquiries/:id", adminAuth, adminController.deleteInquiry);

// Company Management
router.get("/companies", adminAuth, adminController.getAllCompanies);
router.post("/companies/:id/verify", adminAuth, adminController.verifyCompany);
router.put("/companies/:id", adminAuth, adminController.updateCompany);

// Settings
router.get("/settings", adminAuth, adminController.getSettings);
router.put("/settings", adminAuth, adminController.updateSetting);

// Activity Logs
router.get("/activity-logs", adminAuth, adminController.getActivityLogs);

// Super Admin Only
router.post("/create", superAdminAuth, adminController.createAdmin);

module.exports = router;
