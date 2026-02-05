const prisma = require("../shared/database/prisma.service");

class RFQService {
  // ========== BUYER OPERATIONS ==========

  /**
   * Get all RFQs for a buyer
   */
  async getBuyerRFQs(buyerId, filters = {}) {
    const { status, search } = filters;

    const where = { buyerId };

    if (status && status !== "all") {
      where.status = status.toUpperCase();
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { rfqNumber: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const rfqs = await prisma.rFQ.findMany({
      where,
      include: {
        quotes: {
          include: {
            seller: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                companyName: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            quotes: true,
            messages: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return rfqs.map((rfq) => ({
      ...rfq,
      quotesCount: rfq._count.quotes,
      messagesCount: rfq._count.messages,
    }));
  }

  /**
   * Get single RFQ details for buyer or seller
   */
  async getRFQDetails(rfqId, userId, userRole) {
    // Build where clause based on user role
    const whereClause = {
      id: rfqId,
    };

    // If buyer, ensure they own the RFQ
    if (userRole === "BUYER") {
      whereClause.buyerId = userId;
    }
    // If seller, ensure RFQ is not DRAFT (sellers can view OPEN, RESPONSES_RECEIVED, CLOSED)
    else if (userRole === "SELLER") {
      whereClause.status = {
        not: "DRAFT",
      };
    }

    const rfq = await prisma.rFQ.findFirst({
      where: whereClause,
      include: {
        buyer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            companyName: true,
          },
        },
        quotes: {
          include: {
            seller: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                companyName: true,
                email: true,
                phone: true,
                company: {
                  select: {
                    name: true,
                    city: true,
                    country: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!rfq) {
      throw new Error("RFQ not found or access denied");
    }

    return rfq;
  }

  /**
   * Create a new RFQ
   */
  async createRFQ(buyerId, rfqData) {
    const {
      title,
      description,
      category,
      quantity,
      unit,
      preferredPrice,
      deliveryLocation,
      timeline,
      attachments,
      deadline,
    } = rfqData;

    const rfqNumber = `RFQ-${Date.now()}`;

    const rfq = await prisma.rFQ.create({
      data: {
        rfqNumber,
        title,
        description,
        category,
        quantity: parseInt(quantity),
        unit: unit || "pieces",
        preferredPrice: preferredPrice ? parseFloat(preferredPrice) : null,
        deliveryLocation,
        timeline,
        attachments: attachments ? JSON.stringify(attachments) : null,
        budget: preferredPrice ? parseFloat(preferredPrice) : 0,
        deadline: new Date(deadline),
        buyerId,
        status: "OPEN",
      },
    });

    return rfq;
  }

  /**
   * Update RFQ
   */
  async updateRFQ(rfqId, buyerId, updateData) {
    // Verify ownership
    const rfq = await prisma.rFQ.findFirst({
      where: { id: rfqId, buyerId },
    });

    if (!rfq) {
      throw new Error("RFQ not found or access denied");
    }

    // Don't allow updating if there are already quotes submitted
    const quotesCount = await prisma.quote.count({
      where: { rfqId },
    });

    if (quotesCount > 0) {
      throw new Error(
        "Cannot update RFQ after quotes have been submitted. Please close this RFQ and create a new one."
      );
    }

    const updated = await prisma.rFQ.update({
      where: { id: rfqId },
      data: updateData,
    });

    return updated;
  }

  /**
   * Close an RFQ
   */
  async closeRFQ(rfqId, buyerId, selectedQuoteId = null) {
    const rfq = await prisma.rFQ.findFirst({
      where: { id: rfqId, buyerId },
    });

    if (!rfq) {
      throw new Error("RFQ not found or access denied");
    }

    // If a quote is selected, verify it belongs to this RFQ
    if (selectedQuoteId) {
      const quote = await prisma.quote.findFirst({
        where: { id: selectedQuoteId, rfqId },
      });

      if (!quote) {
        throw new Error(
          "Selected quote not found or does not belong to this RFQ"
        );
      }

      // Update quote status to accepted
      await prisma.quote.update({
        where: { id: selectedQuoteId },
        data: { status: "ACCEPTED" },
      });

      // Reject all other quotes
      await prisma.quote.updateMany({
        where: {
          rfqId,
          id: { not: selectedQuoteId },
        },
        data: { status: "REJECTED" },
      });
    }

    // Close the RFQ
    const updated = await prisma.rFQ.update({
      where: { id: rfqId },
      data: {
        status: "CLOSED",
        selectedQuoteId,
      },
    });

    return updated;
  }

  /**
   * Delete an RFQ (only if no quotes received)
   */
  async deleteRFQ(rfqId, buyerId) {
    const rfq = await prisma.rFQ.findFirst({
      where: { id: rfqId, buyerId },
      include: { _count: { select: { quotes: true } } },
    });

    if (!rfq) {
      throw new Error("RFQ not found or access denied");
    }

    if (rfq._count.quotes > 0) {
      throw new Error(
        "Cannot delete RFQ with existing quotes. Please close it instead."
      );
    }

    await prisma.rFQ.delete({
      where: { id: rfqId },
    });
  }

  // ========== SELLER OPERATIONS ==========

  /**
   * Get RFQs available for seller to quote
   */
  async getAvailableRFQs(sellerId, filters = {}) {
    const { category, search } = filters;

    const where = {
      status: "OPEN",
    };

    // Optionally filter by category
    if (category && category !== "all") {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { rfqNumber: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const rfqs = await prisma.rFQ.findMany({
      where,
      include: {
        buyer: {
          select: {
            firstName: true,
            lastName: true,
            companyName: true,
            country: true,
          },
        },
        quotes: {
          where: { sellerId },
          select: { id: true, status: true },
        },
        _count: {
          select: { quotes: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return rfqs.map((rfq) => ({
      ...rfq,
      myQuote: rfq.quotes.length > 0 ? rfq.quotes[0] : null,
      totalQuotes: rfq._count.quotes,
      hasQuoted: rfq.quotes.length > 0,
    }));
  }

  /**
   * Get seller's submitted quotes
   */
  async getSellerQuotes(sellerId, filters = {}) {
    const { status, search } = filters;

    const where = { sellerId };

    if (status && status !== "all") {
      where.status = status.toUpperCase();
    }

    if (search) {
      where.rfq = {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { rfqNumber: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    const quotes = await prisma.quote.findMany({
      where,
      include: {
        rfq: {
          select: {
            id: true,
            rfqNumber: true,
            title: true,
            description: true,
            quantity: true,
            unit: true,
            deadline: true,
            status: true,
            buyer: {
              select: {
                firstName: true,
                lastName: true,
                companyName: true,
              },
            },
          },
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return quotes;
  }

  /**
   * Submit a quote for an RFQ
   */
  async submitQuote(sellerId, rfqId, quoteData) {
    const { priceOffer, moq, deliveryTime, additionalNotes } = quoteData;

    // Check if RFQ exists and is open
    const rfq = await prisma.rFQ.findUnique({
      where: { id: rfqId },
    });

    if (!rfq) {
      throw new Error("RFQ not found");
    }

    if (rfq.status !== "OPEN") {
      throw new Error("This RFQ is no longer accepting quotes");
    }

    // Check if seller already submitted a quote
    const existingQuote = await prisma.quote.findFirst({
      where: { rfqId, sellerId },
    });

    if (existingQuote) {
      throw new Error(
        "You have already submitted a quote for this RFQ. Please update it instead."
      );
    }

    // Create quote
    const quote = await prisma.quote.create({
      data: {
        rfqId,
        sellerId,
        priceOffer: parseFloat(priceOffer),
        moq: parseInt(moq),
        deliveryTime,
        additionalNotes,
        status: "SUBMITTED",
      },
      include: {
        seller: {
          select: {
            firstName: true,
            lastName: true,
            companyName: true,
            email: true,
          },
        },
      },
    });

    // Update RFQ status to RESPONSES_RECEIVED if this is the first quote
    const quotesCount = await prisma.quote.count({
      where: { rfqId },
    });

    if (quotesCount === 1) {
      await prisma.rFQ.update({
        where: { id: rfqId },
        data: { status: "RESPONSES_RECEIVED" },
      });
    }

    return quote;
  }

  /**
   * Update a submitted quote
   */
  async updateQuote(quoteId, sellerId, updateData) {
    const quote = await prisma.quote.findFirst({
      where: { id: quoteId, sellerId },
      include: { rfq: true },
    });

    if (!quote) {
      throw new Error("Quote not found or access denied");
    }

    if (quote.rfq.status === "CLOSED") {
      throw new Error("Cannot update quote for a closed RFQ");
    }

    if (quote.status === "ACCEPTED" || quote.status === "REJECTED") {
      throw new Error("Cannot update a quote that has been finalized");
    }

    const updated = await prisma.quote.update({
      where: { id: quoteId },
      data: updateData,
    });

    return updated;
  }

  /**
   * Withdraw a quote
   */
  async withdrawQuote(quoteId, sellerId) {
    const quote = await prisma.quote.findFirst({
      where: { id: quoteId, sellerId },
      include: { rfq: true },
    });

    if (!quote) {
      throw new Error("Quote not found or access denied");
    }

    if (quote.rfq.status === "CLOSED") {
      throw new Error("Cannot withdraw quote for a closed RFQ");
    }

    await prisma.quote.delete({
      where: { id: quoteId },
    });
  }

  // ========== MESSAGING ==========

  /**
   * Send a message in RFQ thread
   */
  async sendMessage(senderId, senderRole, rfqId, quoteId, message) {
    // Verify access
    const rfq = await prisma.rFQ.findUnique({
      where: { id: rfqId },
      include: { quotes: true },
    });

    if (!rfq) {
      throw new Error("RFQ not found");
    }

    // Verify sender has access to this RFQ
    if (senderRole === "BUYER" && rfq.buyerId !== senderId) {
      throw new Error("Access denied");
    }

    if (senderRole === "SELLER" && quoteId) {
      const quote = await prisma.quote.findFirst({
        where: { id: quoteId, sellerId: senderId },
      });
      if (!quote) {
        throw new Error("Access denied");
      }
    }

    const newMessage = await prisma.rFQMessage.create({
      data: {
        rfqId,
        quoteId,
        senderId,
        senderRole,
        message,
      },
    });

    return newMessage;
  }

  /**
   * Get messages for an RFQ/Quote thread
   */
  async getMessages(rfqId, quoteId = null, userId, userRole) {
    // Verify access
    const rfq = await prisma.rFQ.findUnique({
      where: { id: rfqId },
    });

    if (!rfq) {
      throw new Error("RFQ not found");
    }

    if (userRole === "BUYER" && rfq.buyerId !== userId) {
      throw new Error("Access denied");
    }

    if (userRole === "SELLER" && quoteId) {
      const quote = await prisma.quote.findFirst({
        where: { id: quoteId, sellerId: userId },
      });
      if (!quote) {
        throw new Error("Access denied");
      }
    }

    const where = { rfqId };
    if (quoteId) {
      where.quoteId = quoteId;
    }

    const messages = await prisma.rFQMessage.findMany({
      where,
      orderBy: { createdAt: "asc" },
    });

    return messages;
  }

  // ========== ADMIN OPERATIONS ==========

  /**
   * Get all RFQs for admin view
   */
  async getAllRFQs(filters = {}) {
    const { status, search, category } = filters;

    const where = {};

    if (status && status !== "all") {
      where.status = status.toUpperCase();
    }

    if (category && category !== "all") {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { rfqNumber: { contains: search, mode: "insensitive" } },
        { buyer: { companyName: { contains: search, mode: "insensitive" } } },
      ];
    }

    const rfqs = await prisma.rFQ.findMany({
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
        _count: {
          select: { quotes: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return rfqs;
  }

  /**
   * Admin: Get RFQ analytics
   */
  async getRFQAnalytics() {
    const totalRFQs = await prisma.rFQ.count();
    const openRFQs = await prisma.rFQ.count({ where: { status: "OPEN" } });
    const closedRFQs = await prisma.rFQ.count({ where: { status: "CLOSED" } });

    const totalQuotes = await prisma.quote.count();
    const avgQuotesPerRFQ = totalRFQs > 0 ? totalQuotes / totalRFQs : 0;

    // Get RFQs by category
    const rfqsByCategory = await prisma.rFQ.groupBy({
      by: ["category"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    });

    return {
      totalRFQs,
      openRFQs,
      closedRFQs,
      totalQuotes,
      avgQuotesPerRFQ: Math.round(avgQuotesPerRFQ * 100) / 100,
      rfqsByCategory: rfqsByCategory.map((item) => ({
        category: item.category,
        count: item._count.id,
      })),
    };
  }
}

module.exports = new RFQService();
