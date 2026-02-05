const prisma = require("../shared/database/prisma.service");

class BuyerService {
  async getOrders(userId, filters = {}) {
    const { status, search } = filters;

    const where = {
      buyerId: userId,
    };

    if (status && status !== "all") {
      where.status = status.toUpperCase();
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { seller: { companyName: { contains: search, mode: "insensitive" } } },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        seller: {
          select: {
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
      supplierName: order.seller.companyName,
      itemsCount: order.orderItems.length,
    }));
  }

  async getOrderDetails(orderId, userId) {
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        buyerId: userId,
      },
      include: {
        seller: {
          select: {
            companyName: true,
            email: true,
            phone: true,
          },
        },
        orderItems: {
          include: {
            product: {
              select: {
                name: true,
                sku: true,
                price: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    return order;
  }

  async getRFQs(userId) {
    // Redirect to RFQ service for better functionality
    // This endpoint is kept for backward compatibility
    const rfqs = await prisma.rFQ.findMany({
      where: { buyerId: userId },
      include: {
        quotes: {
          include: {
            seller: {
              select: { companyName: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return rfqs.map((rfq) => ({
      ...rfq,
      quotesCount: (rfq.quotes || []).length,
    }));
  }

  // Public endpoint for recent RFQs (for live enquiries on homepage)
  async getRecentRFQs(limit = 20) {
    const rfqs = await prisma.rFQ.findMany({
      where: {
        status: "OPEN", // Only show open RFQs
      },
      include: {
        buyer: {
          select: {
            firstName: true,
            lastName: true,
            country: true,
            company: {
              select: {
                name: true,
                city: true,
                country: true,
              },
            },
          },
        },
        quotes: {
          select: {
            id: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return rfqs.map((rfq) => ({
      id: rfq.id,
      rfqNumber: rfq.rfqNumber,
      title: rfq.title,
      description: rfq.description,
      category: rfq.category,
      quantity: rfq.quantity,
      unit: rfq.unit,
      budget: rfq.budget,
      deadline: rfq.deadline,
      status: rfq.status,
      createdAt: rfq.createdAt,
      location:
        rfq.buyer?.company?.city && rfq.buyer?.company?.country
          ? `${rfq.buyer.company.city}, ${rfq.buyer.company.country}`
          : rfq.buyer?.country || "Location not specified",
      buyerName: rfq.buyer
        ? `${rfq.buyer.firstName} ${rfq.buyer.lastName}`.trim()
        : "Anonymous",
      quotesCount: rfq.quotes?.length || 0,
    }));
  }

  async createRFQ(userId, rfqData) {
    const { title, description, category, quantity, unit, budget, deadline } =
      rfqData;

    const rfqNumber = `RFQ-${Date.now()}`;

    // Convert quantity to integer and budget to float
    const rfq = await prisma.rFQ.create({
      data: {
        rfqNumber,
        title,
        description,
        category,
        quantity: parseInt(quantity), // Convert string to integer
        unit: unit || "pieces", // Default to 'pieces' if not provided
        budget: parseFloat(budget),
        deadline: new Date(deadline),
        buyerId: userId,
        status: "OPEN",
      },
    });

    return rfq;
  }

  async getPurchaseAnalytics(userId) {
    // Get total spend from completed orders
    const completedOrders = await prisma.order.findMany({
      where: {
        buyerId: userId,
        status: "COMPLETED",
      },
      include: {
        orderItems: true,
      },
    });

    const totalSpend = completedOrders.reduce(
      (sum, order) => sum + order.totalAmount,
      0
    );

    // Monthly orders
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const monthlyOrders = await prisma.order.count({
      where: {
        buyerId: userId,
        orderDate: {
          gte: currentMonth,
        },
      },
    });

    // Active suppliers
    const activeSuppliers = await prisma.order.groupBy({
      by: ["sellerId"],
      where: {
        buyerId: userId,
      },
    });

    // Average order value
    const avgOrderValue =
      completedOrders.length > 0 ? totalSpend / completedOrders.length : 0;

    // Compute spending by category by fetching completed order items and summing in JS.
    const completedOrderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          buyerId: userId,
          status: "COMPLETED",
        },
      },
      include: {
        product: {
          include: { category: true },
        },
      },
    });

    const spendingMap = {};
    completedOrderItems.forEach((item) => {
      const categoryName = item.product?.category?.name || "Uncategorized";
      const itemTotal = (item.price || 0) * (item.quantity || 0);
      spendingMap[categoryName] = (spendingMap[categoryName] || 0) + itemTotal;
    });

    const formattedSpending = Object.keys(spendingMap).map((name) => ({
      name,
      amount: Math.round(spendingMap[name] * 100) / 100,
    }));

    // Get recent activity
    const recentOrders = await prisma.order.findMany({
      where: {
        buyerId: userId,
      },
      orderBy: {
        orderDate: "desc",
      },
      take: 5,
    });

    const recentRFQs = await prisma.rFQ.findMany({
      where: {
        buyerId: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    });

    const recentActivity = [
      ...recentOrders.map((order) => ({
        description: `Order #${
          order.orderNumber
        } ${order.status.toLowerCase()}`,
        date: order.orderDate.toISOString().split("T")[0],
      })),
      ...recentRFQs.map((rfq) => ({
        description: `RFQ #${rfq.rfqNumber} created`,
        date: rfq.createdAt.toISOString().split("T")[0],
      })),
    ]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    return {
      totalSpend,
      monthlyOrders,
      activeSuppliers: activeSuppliers.length,
      avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      spendingByCategory: formattedSpending,
      recentActivity,
    };
  }

  async getSuppliers(filters = {}) {
    const { search, category } = filters;

    // User role is a single enum (BUYER or SELLER).
    const where = {
      role: "SELLER",
      company: {
        isVerified: true,
      },
    };

    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: "insensitive" } },
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
      ];
    }

    const suppliers = await prisma.user.findMany({
      where,
      include: {
        company: true,
        products: {
          where:
            category && category !== "all"
              ? {
                  category: {
                    name: category,
                  },
                }
              : undefined,
          take: 5,
        },
      },
    });

    return suppliers;
  }

  // Add these new methods for supplier management
  async getSupplierDetails(supplierId) {
    const supplier = await prisma.user.findFirst({
      where: {
        id: supplierId,
        role: "SELLER",
      },
      include: {
        company: true,
        products: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!supplier) {
      throw new Error("Supplier not found");
    }

    return supplier;
  }

  async saveSupplier(userId, supplierId) {
    // Check if supplier exists
    const supplier = await prisma.user.findFirst({
      where: {
        id: supplierId,
        role: "SELLER",
      },
    });

    if (!supplier) {
      throw new Error("Supplier not found");
    }

    // Add to saved suppliers (you might need a SavedSupplier model for this)
    // For now, we'll just return success
    return { success: true };
  }

  async unsaveSupplier(userId, supplierId) {
    // Remove from saved suppliers
    // For now, we'll just return success
    return { success: true };
  }

  // Inquiries
  async createInquiry(buyerId, data) {
    const {
      productId,
      sellerId: providedSellerId,
      subject,
      message,
      email,
      phone,
    } = data;

    // If product provided, infer seller from product
    let sellerId = providedSellerId;
    if (!sellerId && productId) {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { userId: true },
      });
      if (product) sellerId = product.userId;
    }

    const inquiry = await prisma.inquiry.create({
      data: {
        buyerId,
        sellerId,
        productId,
        subject,
        message,
        email,
        phone,
        status: "PENDING",
      },
    });
    return inquiry;
  }

  async getInquiries(buyerId, { status } = {}) {
    const where = { buyerId };
    if (status && status !== "all") where.status = status.toUpperCase();
    return prisma.inquiry.findMany({ where, orderBy: { createdAt: "desc" } });
  }
}

module.exports = new BuyerService();
