const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();

class AdminService {
  // Authentication
  async login(email, password) {
    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      throw new Error("Invalid credentials");
    }

    if (!admin.isActive) {
      throw new Error("Admin account is inactive");
    }

    const isValidPassword = await bcrypt.compare(password, admin.password);
    if (!isValidPassword) {
      throw new Error("Invalid credentials");
    }

    // Update last login
    await prisma.admin.update({
      where: { id: admin.id },
      data: { lastLogin: new Date() },
    });

    const token = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        role: "ADMIN",
        isSuperAdmin: admin.isSuperAdmin,
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    const { password: _, ...adminData } = admin;
    return { admin: adminData, token };
  }

  async createAdmin(data) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const admin = await prisma.admin.create({
      data: {
        ...data,
        password: hashedPassword,
      },
    });

    const { password: _, ...adminData } = admin;
    return adminData;
  }

  // Dashboard Statistics
  async getDashboardStats() {
    const [
      totalUsers,
      activeBuyers,
      activeSellers,
      totalProducts,
      activeProducts,
      totalOrders,
      pendingOrders,
      totalInquiries,
      pendingInquiries,
      totalRevenue,
      recentOrders,
      recentUsers,
      recentProducts,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "BUYER", isActive: true } }),
      prisma.user.count({ where: { role: "SELLER", isActive: true } }),
      prisma.product.count(),
      prisma.product.count({ where: { status: "ACTIVE" } }),
      prisma.order.count(),
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.inquiry.count(),
      prisma.inquiry.count({ where: { status: "PENDING" } }),
      prisma.order.aggregate({ _sum: { totalAmount: true } }),
      prisma.order.findMany({
        take: 5,
        orderBy: { orderDate: "desc" },
        include: {
          buyer: { select: { firstName: true, lastName: true, email: true } },
          seller: { select: { firstName: true, lastName: true, email: true } },
        },
      }),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      }),
      prisma.product.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          category: true,
          user: { select: { firstName: true, lastName: true } },
        },
      }),
    ]);

    return {
      overview: {
        totalUsers,
        activeBuyers,
        activeSellers,
        totalProducts,
        activeProducts,
        totalOrders,
        pendingOrders,
        totalInquiries,
        pendingInquiries,
        totalRevenue: totalRevenue._sum.totalAmount || 0,
      },
      recent: {
        orders: recentOrders,
        users: recentUsers,
        products: recentProducts,
      },
    };
  }

  // Seller Management
  async getAllSellers(page = 1, limit = 10, filters = {}) {
    const skip = (page - 1) * limit;
    const where = { role: "SELLER", ...filters };

    const [sellers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          company: true,
          products: {
            select: { id: true, status: true },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      sellers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getSellerDetails(sellerId) {
    const seller = await prisma.user.findUnique({
      where: { id: sellerId, role: "SELLER" },
      include: {
        company: true,
        products: {
          include: { category: true },
        },
        sellerOrders: {
          include: {
            buyer: { select: { firstName: true, lastName: true, email: true } },
            orderItems: true,
          },
        },
      },
    });

    if (!seller) {
      throw new Error("Seller not found");
    }

    return seller;
  }

  async updateSellerStatus(sellerId, isActive) {
    return await prisma.user.update({
      where: { id: sellerId },
      data: { isActive },
    });
  }

  async approveSeller(sellerId) {
    return await prisma.user.update({
      where: { id: sellerId },
      data: { isActive: true, emailVerified: true },
    });
  }

  async deleteSeller(sellerId) {
    return await prisma.user.delete({
      where: { id: sellerId },
    });
  }

  // Product Management
  async getAllProducts(page = 1, limit = 10, filters = {}) {
    const skip = (page - 1) * limit;
    const where = { ...filters };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          category: true,
          user: { select: { firstName: true, lastName: true, email: true } },
          company: { select: { name: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return {
      products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateProductStatus(productId, status) {
    return await prisma.product.update({
      where: { id: productId },
      data: { status },
    });
  }

  async deleteProduct(productId) {
    return await prisma.product.delete({
      where: { id: productId },
    });
  }

  // Category Management
  async getAllCategories(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        skip,
        take: limit,
        orderBy: { name: "asc" },
        include: {
          parent: {
            select: { id: true, name: true },
          },
          _count: {
            select: {
              products: true,
              children: true,
            },
          },
        },
      }),
      prisma.category.count(),
    ]);

    return {
      categories,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createCategory(data) {
    // Calculate depth if parent is provided
    let depth = 0;
    if (data.parentId) {
      const parent = await prisma.category.findUnique({
        where: { id: data.parentId },
        select: { depth: true },
      });
      if (parent) {
        depth = parent.depth + 1;
      }
    }

    // Generate slug if not provided
    const slug =
      data.slug ||
      data.name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

    return await prisma.category.create({
      data: {
        ...data,
        slug,
        depth,
      },
      include: {
        parent: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async updateCategory(categoryId, data) {
    // If parentId is being updated, recalculate depth
    let depth;
    if (data.parentId !== undefined) {
      if (data.parentId) {
        const parent = await prisma.category.findUnique({
          where: { id: data.parentId },
          select: { depth: true },
        });
        if (parent) {
          depth = parent.depth + 1;
        }
      } else {
        depth = 0;
      }
    }

    // Update slug if name is being updated
    const slug = data.name
      ? data.slug ||
        data.name
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "")
      : data.slug;

    return await prisma.category.update({
      where: { id: categoryId },
      data: {
        ...data,
        ...(slug && { slug }),
        ...(depth !== undefined && { depth }),
      },
      include: {
        parent: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async deleteCategory(categoryId) {
    // Check if category has products
    const productCount = await prisma.product.count({
      where: { categoryId },
    });

    if (productCount > 0) {
      throw new Error("Cannot delete category with existing products");
    }

    // Check if category has subcategories
    const childrenCount = await prisma.category.count({
      where: { parentId: categoryId },
    });

    if (childrenCount > 0) {
      throw new Error("Cannot delete category with existing subcategories");
    }

    return await prisma.category.delete({
      where: { id: categoryId },
    });
  }

  // Buyer Management
  async getAllBuyers(page = 1, limit = 10, filters = {}) {
    const skip = (page - 1) * limit;
    const where = { role: "BUYER", ...filters };

    const [buyers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          company: true,
          orders: {
            select: { id: true, totalAmount: true, status: true },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      buyers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getBuyerDetails(buyerId) {
    const buyer = await prisma.user.findUnique({
      where: { id: buyerId, role: "BUYER" },
      include: {
        company: true,
        orders: {
          include: {
            seller: {
              select: { firstName: true, lastName: true, email: true },
            },
            orderItems: {
              include: { product: true },
            },
          },
        },
        rfqs: true,
      },
    });

    if (!buyer) {
      throw new Error("Buyer not found");
    }

    return buyer;
  }

  async updateBuyerStatus(buyerId, isActive) {
    return await prisma.user.update({
      where: { id: buyerId },
      data: { isActive },
    });
  }

  // Inquiry Management
  async getAllInquiries(page = 1, limit = 10, filters = {}) {
    const skip = (page - 1) * limit;
    const where = { ...filters };

    const [inquiries, total] = await Promise.all([
      prisma.inquiry.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.inquiry.count({ where }),
    ]);

    return {
      inquiries,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateInquiryStatus(inquiryId, status, response = null) {
    return await prisma.inquiry.update({
      where: { id: inquiryId },
      data: { status, response },
    });
  }

  async deleteInquiry(inquiryId) {
    return await prisma.inquiry.delete({
      where: { id: inquiryId },
    });
  }

  // Company Management
  async getAllCompanies(page = 1, limit = 10, filters = {}) {
    const skip = (page - 1) * limit;
    const where = { ...filters };

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { users: true, products: true },
          },
        },
      }),
      prisma.company.count({ where }),
    ]);

    return {
      companies,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async verifyCompany(companyId) {
    return await prisma.company.update({
      where: { id: companyId },
      data: { isVerified: true },
    });
  }

  async updateCompany(companyId, data) {
    return await prisma.company.update({
      where: { id: companyId },
      data,
    });
  }

  // Settings
  async getSettings(category = null) {
    const where = category ? { category } : {};
    return await prisma.systemSettings.findMany({ where });
  }

  async updateSetting(key, value) {
    return await prisma.systemSettings.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  // Activity Logging
  async logActivity(
    adminId,
    action,
    entityType,
    entityId = null,
    description = null,
    ipAddress = null
  ) {
    return await prisma.adminActivityLog.create({
      data: {
        adminId,
        action,
        entityType,
        entityId,
        description,
        ipAddress,
      },
    });
  }

  async getActivityLogs(page = 1, limit = 20, filters = {}) {
    const skip = (page - 1) * limit;
    const where = { ...filters };

    const [logs, total] = await Promise.all([
      prisma.adminActivityLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          admin: {
            select: { firstName: true, lastName: true, email: true },
          },
        },
      }),
      prisma.adminActivityLog.count({ where }),
    ]);

    return {
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

module.exports = new AdminService();
