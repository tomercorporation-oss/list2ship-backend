const prisma = require("../shared/database/prisma.service");

class SellerService {
  async getProducts(userId, filters = {}) {
    const { category, search } = filters;

    const where = {
      userId: userId,
    };

    if (category && category !== "all") {
      where.category = {
        name: category,
      };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return products;
  }

  async createProduct(userId, productData) {
    const { name, description, price, sku, stock, categoryId, image, moq } =
      productData;

    // Verify category exists
    const categoryRecord = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!categoryRecord) {
      throw new Error("Invalid category selected");
    }

    // Get user's company
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    });

    // USER MUST BE A SELLER
    if (user.role !== "SELLER") {
      throw new Error("You must become a seller before adding products.");
    }

    // MUST HAVE A COMPANY
    if (!user.company) {
      throw new Error(
        "Please complete your company profile before adding products."
      );
    }

    // COUNT EXISTING PRODUCTS
    const productCount = await prisma.product.count({
      where: { userId: userId },
    });

    // IF COMPANY NOT VERIFIED → MAX 3 PRODUCTS
    if (!user.company.isVerified && productCount >= 3) {
      throw new Error(
        "Unverified sellers can list only 3 products. Please verify your company to list unlimited products."
      );
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        sku,
        stock: parseInt(stock),
        moq: moq ? parseInt(moq) : 1, // Default to 1 if not provided
        categoryId: categoryRecord.id,
        userId: userId,
        companyId: user.company.id,
        image,
        status: "ACTIVE",
      },
      include: {
        category: true,
      },
    });

    return product;
  }

  async updateProduct(productId, userId, updateData) {
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        userId: userId,
      },
    });

    if (!product) {
      throw new Error("Product not found or access denied");
    }

    // Handle categoryId if provided
    let categoryId = product.categoryId; // Keep existing category by default

    if (updateData.categoryId) {
      // Verify the category exists
      const categoryRecord = await prisma.category.findUnique({
        where: { id: updateData.categoryId },
      });

      if (!categoryRecord) {
        throw new Error("Invalid category selected");
      }

      categoryId = updateData.categoryId;
    }

    // Prepare update data without the categoryId and category (handled separately)
    const { categoryId: _, category, ...restData } = updateData;

    // Parse numeric fields if they exist
    if (restData.price !== undefined) {
      restData.price = parseFloat(restData.price);
    }
    if (restData.stock !== undefined) {
      restData.stock = parseInt(restData.stock);
    }
    if (restData.moq !== undefined) {
      restData.moq = parseInt(restData.moq);
    }

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        ...restData,
        categoryId: categoryId,
      },
      include: {
        category: true,
      },
    });

    return updatedProduct;
  }

  async deleteProduct(productId, userId) {
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        userId: userId,
      },
    });

    if (!product) {
      throw new Error("Product not found or access denied");
    }

    await prisma.product.delete({
      where: { id: productId },
    });
  }

  async getSellerOrders(userId, filters = {}) {
    const { status, search } = filters;

    const where = {
      sellerId: userId,
    };

    if (status && status !== "all") {
      where.status = status.toUpperCase();
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        {
          buyer: {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
              { companyName: { contains: search, mode: "insensitive" } },
            ],
          },
        },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        buyer: {
          select: {
            firstName: true,
            lastName: true,
            companyName: true,
            email: true,
          },
        },
        orderItems: {
          include: {
            product: {
              select: {
                name: true,
                sku: true,
              },
            },
          },
        },
      },
      orderBy: {
        orderDate: "desc",
      },
    });

    return orders.map((order) => ({
      ...order,
      customerName: `${order.buyer.firstName} ${order.buyer.lastName}`,
      companyName: order.buyer.companyName,
      itemsCount: order.orderItems.length,
    }));
  }

  async updateOrderStatus(orderId, userId, status) {
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        sellerId: userId,
      },
    });

    if (!order) {
      throw new Error("Order not found or access denied");
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: status.toUpperCase(),
        ...(status.toUpperCase() === "SHIPPED" && { shippedDate: new Date() }),
        ...(status.toUpperCase() === "COMPLETED" && {
          deliveredDate: new Date(),
        }),
      },
    });

    return updatedOrder;
  }

  async getSalesAnalytics(userId) {
    try {
      // Get total revenue and order count using aggregation
      const revenueAggregation = await prisma.order.aggregate({
        where: {
          sellerId: userId,
          status: "COMPLETED",
        },
        _sum: {
          totalAmount: true,
        },
        _count: {
          id: true,
        },
      });

      const totalRevenue = revenueAggregation._sum.totalAmount || 0;
      const totalCompletedOrders = revenueAggregation._count.id || 0;

      // Monthly orders (current month)
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);

      const monthlyOrders = await prisma.order.count({
        where: {
          sellerId: userId,
          orderDate: {
            gte: currentMonth,
          },
        },
      });

      // Conversion rate (quotes to orders)
      const totalQuotes = await prisma.quote.count({
        where: { sellerId: userId },
      });

      const acceptedQuotes = await prisma.quote.count({
        where: {
          sellerId: userId,
          status: "ACCEPTED",
        },
      });

      const conversionRate =
        totalQuotes > 0 ? (acceptedQuotes / totalQuotes) * 100 : 0;

      // Average order value
      const avgOrderValue =
        totalCompletedOrders > 0 ? totalRevenue / totalCompletedOrders : 0;

      // Get top selling products
      const orderItems = await prisma.orderItem.findMany({
        where: {
          order: {
            sellerId: userId,
            status: "COMPLETED",
          },
        },
        include: {
          product: {
            select: {
              name: true,
            },
          },
          order: {
            select: {
              id: true,
            },
          },
        },
      });

      // Calculate product performance
      const productPerformance = {};
      orderItems.forEach((item) => {
        const productId = item.productId;
        if (!productPerformance[productId]) {
          productPerformance[productId] = {
            name: item.product?.name || "Unknown Product",
            revenue: 0,
            quantity: 0,
            orders: new Set(),
          };
        }

        // Calculate revenue for this item: quantity * unit price
        const itemRevenue = item.quantity * item.price;
        productPerformance[productId].revenue += itemRevenue;
        productPerformance[productId].quantity += item.quantity;
        productPerformance[productId].orders.add(item.orderId);
      });

      // Convert to array and sort by revenue
      const topProducts = Object.values(productPerformance)
        .map((item) => ({
          name: item.name,
          revenue: Math.round(item.revenue * 100) / 100,
          orders: item.orders.size,
          quantity: item.quantity,
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Get sales trends for last 3 months
      const salesTrends = [];

      for (let i = 2; i >= 0; i--) {
        const month = new Date();
        month.setMonth(month.getMonth() - i);
        const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
        const endOfMonth = new Date(
          month.getFullYear(),
          month.getMonth() + 1,
          0,
          23,
          59,
          59
        );

        const monthlyData = await prisma.order.aggregate({
          where: {
            sellerId: userId,
            status: "COMPLETED",
            orderDate: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
          _sum: {
            totalAmount: true,
          },
          _count: {
            id: true,
          },
        });

        // Calculate growth (for demo purposes - in real app, compare with previous month)
        let growth = 0;
        if (i === 2) growth = 12; // +12% for current month
        else if (i === 1) growth = 8; // +8% for previous month
        else growth = -2; // -2% for month before

        salesTrends.push({
          period: startOfMonth.toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          }),
          revenue: monthlyData._sum.totalAmount || 0,
          orders: monthlyData._count.id || 0,
          growth: growth,
        });
      }

      return {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        monthlyOrders,
        conversionRate: Math.round(conversionRate * 100) / 100,
        avgOrderValue: Math.round(avgOrderValue * 100) / 100,
        topProducts,
        salesTrends,
      };
    } catch (error) {
      console.error("Error in getSalesAnalytics:", error);
      throw error;
    }
  }

  async getVerificationStatus(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // If no company profile exists, return a response indicating that
    if (!user.company) {
      return {
        isVerified: false,
        company: null,
        verificationStep: 0,
        requiresCompanySetup: true,
      };
    }

    // Return only fields that exist on the Company model. Fields like
    // verificationDocuments / verificationStatus are not present in schema
    // by default. Keep the response minimal and rely on frontend to store
    // documents via a proper endpoint once a DB field/model is added.
    return {
      isVerified: user.company.isVerified,
      company: user.company,
      verificationStep: user.company.isVerified ? 4 : 1,
      requiresCompanySetup: false,
    };
  }

  async submitVerification(userId, documents) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    });

    if (!user.company) {
      throw new Error("Company not found");
    }

    // At present we don't have dedicated verification fields in Company.
    // To avoid schema changes here, just acknowledge receipt and return a
    // result object. In future we should persist this in a `CompanyVerification`
    // table or add JSON fields to Company.
    console.log(
      `Received verification submission for company ${user.company.id}`,
      Object.keys(documents)
    );

    return {
      submitted: true,
      documents: Object.keys(documents),
      estimatedCompletion: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      status: "PENDING",
    };
  }

  async getCompanyProfile(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    });

    if (!user.company) {
      throw new Error("Company not found");
    }

    return user.company;
  }

  async updateCompanyProfile(userId, profileData) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    });

    if (!user.company) {
      throw new Error("Company not found");
    }

    const updatedCompany = await prisma.company.update({
      where: { id: user.company.id },
      data: profileData,
    });

    return updatedCompany;
  }

  // Inquiries
  async getInquiries(sellerId, { status } = {}) {
    const where = { sellerId };
    if (status && status !== "all") where.status = status.toUpperCase();
    return prisma.inquiry.findMany({ where, orderBy: { createdAt: "desc" } });
  }

  async replyToInquiry(inquiryId, sellerId, response) {
    // Ensure inquiry belongs to seller
    const inquiry = await prisma.inquiry.findFirst({
      where: { id: inquiryId, sellerId },
    });
    if (!inquiry) throw new Error("Inquiry not found or access denied");

    return prisma.inquiry.update({
      where: { id: inquiryId },
      data: { response, status: "REPLIED" },
    });
  }

  // RFQ related methods (for backward compatibility and quick access)
  async getAvailableRFQs(userId, filters = {}) {
    // Redirect to dedicated RFQ service for full functionality
    // This is kept for quick seller dashboard access
    const { category } = filters;

    const where = {
      status: "OPEN",
    };

    if (category && category !== "all") {
      where.category = category;
    }

    const rfqs = await prisma.rFQ.findMany({
      where,
      include: {
        buyer: {
          select: {
            firstName: true,
            lastName: true,
            companyName: true,
          },
        },
        quotes: {
          where: { sellerId: userId },
          select: { id: true, status: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20, // Limit for dashboard view
    });

    return rfqs.map((rfq) => ({
      ...rfq,
      hasQuoted: rfq.quotes.length > 0,
      myQuoteStatus: rfq.quotes.length > 0 ? rfq.quotes[0].status : null,
    }));
  }

  async getMyQuotes(userId) {
    // Quick access for seller dashboard
    const quotes = await prisma.quote.findMany({
      where: { sellerId: userId },
      include: {
        rfq: {
          select: {
            rfqNumber: true,
            title: true,
            status: true,
            deadline: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return quotes;
  }
}

module.exports = new SellerService();
