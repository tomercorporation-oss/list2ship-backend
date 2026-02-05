const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const authRoutes = require("./auth/auth.routes");
const buyerRoutes = require("./buyer/buyer.routes");
const sellerRoutes = require("./seller/seller.routes");
const userRoutes = require("./user/user.routes");
const companyRoutes = require("./company/company.routes");
const productRoutes = require("./product/product.routes");
const categoryRoutes = require("./category/category.routes");
const adminRoutes = require("./admin/admin.routes");
const rfqRoutes = require("./rfq/rfq.routes");
const cartRoutes = require("./cart/cart.routes");

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan("combined"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/buyer", buyerRoutes);
app.use("/api/seller", sellerRoutes);
app.use("/api/user", userRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/rfq", rfqRoutes);
app.use("/api/cart", cartRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "B2B Marketplace API is running",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler - FIXED: Don't use '*', use a proper catch-all
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error("💥 Global error handler:", error);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    ...(process.env.NODE_ENV === "development" && { error: error.message }),
  });
});

module.exports = app;
