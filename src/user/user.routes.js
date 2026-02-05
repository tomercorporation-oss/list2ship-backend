const express = require("express");
const userController = require("./user.controller");
const { authenticate } = require("../auth/middleware/auth.middleware");

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// User profile
router.get("/profile", userController.getUserProfile);
router.put("/profile", userController.updateUserProfile);

// Verification
router.post("/verify-email", userController.verifyEmail);
router.post("/verify-phone", userController.verifyPhone);

module.exports = router;
