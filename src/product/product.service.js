const prisma = require("../shared/database/prisma.service");

class ProductService {
  async getAllProducts(filters = {}) {
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
      sortBy = "newest",
      limit = 20,
      offset = 0,
    } = filters;

    const where = {
      status: "ACTIVE", // Only show active products to public
    };

    // Category filter
    if (categoryId) {
      where.categoryId = categoryId;
    } else if (categorySlug) {
      where.category = { slug: categorySlug };
    } else if (category && category !== "all") {
      where.category = { name: category };
    }

    // Search filter - search in product name, description, category name, and company name
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { category: { name: { contains: search, mode: "insensitive" } } },
        { company: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) {
        where.price.gte = parseFloat(minPrice);
      }
      if (maxPrice !== undefined) {
        where.price.lte = parseFloat(maxPrice);
      }
    }

    // MOQ range filter (assuming stock field represents MOQ for now)
    if (minMoq !== undefined || maxMoq !== undefined) {
      where.stock = {};
      if (minMoq !== undefined) {
        where.stock.gte = parseInt(minMoq);
      }
      if (maxMoq !== undefined) {
        where.stock.lte = parseInt(maxMoq);
      }
    }

    // Company/Seller filter
    if (companyId) {
      where.companyId = companyId;
    }

    // Determine sort order
    let orderBy = { createdAt: "desc" }; // Default: newest first
    switch (sortBy) {
      case "price-low":
        orderBy = { price: "asc" };
        break;
      case "price-high":
        orderBy = { price: "desc" };
        break;
      case "moq-low":
        orderBy = { stock: "asc" };
        break;
      case "moq-high":
        orderBy = { stock: "desc" };
        break;
      case "name-asc":
        orderBy = { name: "asc" };
        break;
      case "name-desc":
        orderBy = { name: "desc" };
        break;
      default:
        orderBy = { createdAt: "desc" };
    }

    // Get total count for pagination
    const totalCount = await prisma.product.count({ where });

    // Get products with filters
    const products = await prisma.product.findMany({
      where,
      include: {
        category: {
          select: {
            name: true,
            slug: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
            isVerified: true,
          },
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy,
      take: limit,
      skip: offset,
    });

    return {
      products,
      totalCount,
      currentPage: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(totalCount / limit),
      itemsPerPage: limit,
    };
  }

  async getRecentProducts(limit = 4) {
    const products = await prisma.product.findMany({
      where: {
        status: "ACTIVE",
      },
      include: {
        category: {
          select: {
            name: true,
          },
        },
        company: {
          select: {
            name: true,
            country: true,
            isVerified: true,
          },
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    return products;
  }

  async getUserRecentProducts(userId, limit = 3) {
    const products = await prisma.product.findMany({
      where: {
        userId: userId,
        status: "ACTIVE",
      },
      include: {
        category: {
          select: {
            name: true,
          },
        },
        company: {
          select: {
            name: true,
            country: true,
            isVerified: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    return products;
  }

  async getProductById(productId) {
    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
      include: {
        category: {
          select: {
            name: true,
          },
        },
        company: {
          select: {
            name: true,
            city: true,
            country: true,
            isVerified: true,
          },
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return product;
  }
}

module.exports = new ProductService();
