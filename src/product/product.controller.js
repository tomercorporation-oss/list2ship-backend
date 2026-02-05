const productService = require("./product.service");

class ProductController {
  async getAllProducts(req, res) {
    try {
      const {
        category,
        categoryId,
        categorySlug,
        search,
        minPrice,
        maxPrice,
        minMoq,
        maxMoq,
        companyId,
        sortBy,
        limit,
        offset,
      } = req.query;

      const result = await productService.getAllProducts({
        category,
        categoryId,
        categorySlug,
        search,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        minMoq: minMoq ? parseInt(minMoq) : undefined,
        maxMoq: maxMoq ? parseInt(maxMoq) : undefined,
        companyId,
        sortBy,
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined,
      });

      res.json({
        success: true,
        data: result.products,
        pagination: {
          totalCount: result.totalCount,
          currentPage: result.currentPage,
          totalPages: result.totalPages,
          itemsPerPage: result.itemsPerPage,
        },
      });
    } catch (error) {
      console.error("💥 Get all products error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch products",
      });
    }
  }

  async getRecentProducts(req, res) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 4;

      const products = await productService.getRecentProducts(limit);

      res.json({
        success: true,
        data: products,
      });
    } catch (error) {
      console.error("💥 Get recent products error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch recent products",
      });
    }
  }

  async getProductById(req, res) {
    try {
      const { productId } = req.params;

      const product = await productService.getProductById(productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      res.json({
        success: true,
        data: product,
      });
    } catch (error) {
      console.error("💥 Get product by id error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch product",
      });
    }
  }

  async getUserRecentProducts(req, res) {
    try {
      const userId = req.user.userId;
      const limit = req.query.limit ? parseInt(req.query.limit) : 3;

      const products = await productService.getUserRecentProducts(
        userId,
        limit
      );

      res.json({
        success: true,
        data: products,
      });
    } catch (error) {
      console.error("💥 Get user recent products error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch user recent products",
      });
    }
  }
}

module.exports = new ProductController();
