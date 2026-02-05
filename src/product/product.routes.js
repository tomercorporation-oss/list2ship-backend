const express = require("express");
const productController = require("./product.controller");
const { authenticate } = require("../auth/middleware/auth.middleware");

const router = express.Router();

// Public routes (no authentication required)
router.get("/recent", productController.getRecentProducts);
router.get("/", productController.getAllProducts);
router.get("/:productId", productController.getProductById);

// Protected routes (authentication required)
router.get(
  "/user/my-recent",
  authenticate,
  productController.getUserRecentProducts
);

module.exports = router;
