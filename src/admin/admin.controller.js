const adminService = require("./admin.service");

class AdminController {
  // Authentication
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Email and password are required",
        });
      }

      const result = await adminService.login(email, password);

      // Log activity
      await adminService.logActivity(
        result.admin.id,
        "LOGIN",
        "ADMIN",
        result.admin.id,
        "Admin logged in",
        req.ip
      );

      res.json({
        success: true,
        data: result,
        message: "Login successful",
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: error.message,
      });
    }
  }

  async createAdmin(req, res) {
    try {
      const admin = await adminService.createAdmin(req.body);

      // Log activity
      await adminService.logActivity(
        req.admin.id,
        "CREATE",
        "ADMIN",
        admin.id,
        `Created new admin: ${admin.email}`,
        req.ip
      );

      res.status(201).json({
        success: true,
        data: admin,
        message: "Admin created successfully",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Dashboard
  async getDashboardStats(req, res) {
    try {
      const stats = await adminService.getDashboardStats();
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Seller Management
  async getAllSellers(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const filters = {};

      if (req.query.isActive) {
        filters.isActive = req.query.isActive === "true";
      }
      if (req.query.emailVerified) {
        filters.emailVerified = req.query.emailVerified === "true";
      }
      if (req.query.search) {
        filters.OR = [
          { email: { contains: req.query.search, mode: "insensitive" } },
          { firstName: { contains: req.query.search, mode: "insensitive" } },
          { lastName: { contains: req.query.search, mode: "insensitive" } },
        ];
      }

      const result = await adminService.getAllSellers(page, limit, filters);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getSellerDetails(req, res) {
    try {
      const seller = await adminService.getSellerDetails(req.params.id);
      res.json({
        success: true,
        data: seller,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }

  async updateSellerStatus(req, res) {
    try {
      const { isActive } = req.body;
      const seller = await adminService.updateSellerStatus(
        req.params.id,
        isActive
      );

      // Log activity
      await adminService.logActivity(
        req.admin.id,
        "UPDATE",
        "SELLER",
        req.params.id,
        `Updated seller status to ${isActive ? "active" : "inactive"}`,
        req.ip
      );

      res.json({
        success: true,
        data: seller,
        message: "Seller status updated successfully",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async approveSeller(req, res) {
    try {
      const seller = await adminService.approveSeller(req.params.id);

      // Log activity
      await adminService.logActivity(
        req.admin.id,
        "APPROVE",
        "SELLER",
        req.params.id,
        "Approved seller account",
        req.ip
      );

      res.json({
        success: true,
        data: seller,
        message: "Seller approved successfully",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async deleteSeller(req, res) {
    try {
      await adminService.deleteSeller(req.params.id);

      // Log activity
      await adminService.logActivity(
        req.admin.id,
        "DELETE",
        "SELLER",
        req.params.id,
        "Deleted seller account",
        req.ip
      );

      res.json({
        success: true,
        message: "Seller deleted successfully",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Product Management
  async getAllProducts(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const filters = {};

      if (req.query.status) {
        filters.status = req.query.status;
      }
      if (req.query.categoryId) {
        filters.categoryId = req.query.categoryId;
      }
      if (req.query.search) {
        filters.OR = [
          { name: { contains: req.query.search, mode: "insensitive" } },
          { sku: { contains: req.query.search, mode: "insensitive" } },
        ];
      }

      const result = await adminService.getAllProducts(page, limit, filters);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async updateProductStatus(req, res) {
    try {
      const { status } = req.body;
      const product = await adminService.updateProductStatus(
        req.params.id,
        status
      );

      // Log activity
      await adminService.logActivity(
        req.admin.id,
        "UPDATE",
        "PRODUCT",
        req.params.id,
        `Updated product status to ${status}`,
        req.ip
      );

      res.json({
        success: true,
        data: product,
        message: "Product status updated successfully",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async deleteProduct(req, res) {
    try {
      await adminService.deleteProduct(req.params.id);

      // Log activity
      await adminService.logActivity(
        req.admin.id,
        "DELETE",
        "PRODUCT",
        req.params.id,
        "Deleted product",
        req.ip
      );

      res.json({
        success: true,
        message: "Product deleted successfully",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Category Management
  async getAllCategories(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      const result = await adminService.getAllCategories(page, limit);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async createCategory(req, res) {
    try {
      const category = await adminService.createCategory(req.body);

      // Log activity
      await adminService.logActivity(
        req.admin.id,
        "CREATE",
        "CATEGORY",
        category.id,
        `Created category: ${category.name}`,
        req.ip
      );

      res.status(201).json({
        success: true,
        data: category,
        message: "Category created successfully",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async updateCategory(req, res) {
    try {
      const category = await adminService.updateCategory(
        req.params.id,
        req.body
      );

      // Log activity
      await adminService.logActivity(
        req.admin.id,
        "UPDATE",
        "CATEGORY",
        req.params.id,
        `Updated category: ${category.name}`,
        req.ip
      );

      res.json({
        success: true,
        data: category,
        message: "Category updated successfully",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async deleteCategory(req, res) {
    try {
      await adminService.deleteCategory(req.params.id);

      // Log activity
      await adminService.logActivity(
        req.admin.id,
        "DELETE",
        "CATEGORY",
        req.params.id,
        "Deleted category",
        req.ip
      );

      res.json({
        success: true,
        message: "Category deleted successfully",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Buyer Management
  async getAllBuyers(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const filters = {};

      if (req.query.isActive) {
        filters.isActive = req.query.isActive === "true";
      }
      if (req.query.search) {
        filters.OR = [
          { email: { contains: req.query.search, mode: "insensitive" } },
          { firstName: { contains: req.query.search, mode: "insensitive" } },
          { lastName: { contains: req.query.search, mode: "insensitive" } },
        ];
      }

      const result = await adminService.getAllBuyers(page, limit, filters);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getBuyerDetails(req, res) {
    try {
      const buyer = await adminService.getBuyerDetails(req.params.id);
      res.json({
        success: true,
        data: buyer,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }

  async updateBuyerStatus(req, res) {
    try {
      const { isActive } = req.body;
      const buyer = await adminService.updateBuyerStatus(
        req.params.id,
        isActive
      );

      // Log activity
      await adminService.logActivity(
        req.admin.id,
        "UPDATE",
        "BUYER",
        req.params.id,
        `Updated buyer status to ${isActive ? "active" : "inactive"}`,
        req.ip
      );

      res.json({
        success: true,
        data: buyer,
        message: "Buyer status updated successfully",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Inquiry Management
  async getAllInquiries(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const filters = {};

      if (req.query.status) {
        filters.status = req.query.status;
      }
      if (req.query.priority) {
        filters.priority = req.query.priority;
      }

      const result = await adminService.getAllInquiries(page, limit, filters);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async updateInquiryStatus(req, res) {
    try {
      const { status, response } = req.body;
      const inquiry = await adminService.updateInquiryStatus(
        req.params.id,
        status,
        response
      );

      // Log activity
      await adminService.logActivity(
        req.admin.id,
        "UPDATE",
        "INQUIRY",
        req.params.id,
        `Updated inquiry status to ${status}`,
        req.ip
      );

      res.json({
        success: true,
        data: inquiry,
        message: "Inquiry updated successfully",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async deleteInquiry(req, res) {
    try {
      await adminService.deleteInquiry(req.params.id);

      // Log activity
      await adminService.logActivity(
        req.admin.id,
        "DELETE",
        "INQUIRY",
        req.params.id,
        "Deleted inquiry",
        req.ip
      );

      res.json({
        success: true,
        message: "Inquiry deleted successfully",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Company Management
  async getAllCompanies(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const filters = {};

      if (req.query.isVerified) {
        filters.isVerified = req.query.isVerified === "true";
      }
      if (req.query.search) {
        filters.OR = [
          { name: { contains: req.query.search, mode: "insensitive" } },
          { email: { contains: req.query.search, mode: "insensitive" } },
        ];
      }

      const result = await adminService.getAllCompanies(page, limit, filters);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async verifyCompany(req, res) {
    try {
      const company = await adminService.verifyCompany(req.params.id);

      // Log activity
      await adminService.logActivity(
        req.admin.id,
        "VERIFY",
        "COMPANY",
        req.params.id,
        `Verified company: ${company.name}`,
        req.ip
      );

      res.json({
        success: true,
        data: company,
        message: "Company verified successfully",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async updateCompany(req, res) {
    try {
      const company = await adminService.updateCompany(req.params.id, req.body);

      // Log activity
      await adminService.logActivity(
        req.admin.id,
        "UPDATE",
        "COMPANY",
        req.params.id,
        `Updated company: ${company.name}`,
        req.ip
      );

      res.json({
        success: true,
        data: company,
        message: "Company updated successfully",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Settings
  async getSettings(req, res) {
    try {
      const settings = await adminService.getSettings(req.query.category);
      res.json({
        success: true,
        data: settings,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async updateSetting(req, res) {
    try {
      const { key, value } = req.body;
      const setting = await adminService.updateSetting(key, value);

      // Log activity
      await adminService.logActivity(
        req.admin.id,
        "UPDATE",
        "SETTING",
        key,
        `Updated setting: ${key}`,
        req.ip
      );

      res.json({
        success: true,
        data: setting,
        message: "Setting updated successfully",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Activity Logs
  async getActivityLogs(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const filters = {};

      if (req.query.adminId) {
        filters.adminId = req.query.adminId;
      }
      if (req.query.action) {
        filters.action = req.query.action;
      }
      if (req.query.entityType) {
        filters.entityType = req.query.entityType;
      }

      const result = await adminService.getActivityLogs(page, limit, filters);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new AdminController();
