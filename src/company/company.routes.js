const express = require("express");
const companyController = require("./company.controller");
const { authenticate } = require("../auth/middleware/auth.middleware");

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Company profile
router.get("/profile", companyController.getCompanyProfile);
router.put("/profile", companyController.updateCompanyProfile);

// Verification
router.post("/request-verification", companyController.requestVerification);

// Dashboard stats
router.get("/dashboard/stats", companyController.getDashboardStats);

module.exports = router;
