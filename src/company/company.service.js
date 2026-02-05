const prisma = require("../shared/database/prisma.service");

class CompanyService {
  async getCompanyProfile(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Return null if no company exists instead of throwing error
    if (!user.company) {
      return null;
    }

    return user.company;
  }

  async updateCompanyProfile(userId, profileData) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // If company doesn't exist, create it
    if (!user.company) {
      const newCompany = await prisma.company.create({
        data: {
          name: profileData.name,
          email: profileData.email,
          phone: profileData.phone,
          address: profileData.address,
          city: profileData.city,
          state: profileData.state,
          country: profileData.country,
          postalCode: profileData.postalCode,
          description: profileData.description,
          businessType: profileData.businessType,
          taxId: profileData.taxId,
          isVerified: false,
        },
      });

      // Link user to company and upgrade role to SELLER if currently BUYER
      const updateData = { companyId: newCompany.id };
      if (user.role === "BUYER") {
        updateData.role = "SELLER";
      }

      await prisma.user.update({
        where: { id: userId },
        data: updateData,
      });

      return newCompany;
    }

    // Update existing company
    const updatedCompany = await prisma.company.update({
      where: { id: user.company.id },
      data: {
        ...(profileData.name && { name: profileData.name }),
        ...(profileData.email && { email: profileData.email }),
        ...(profileData.phone && { phone: profileData.phone }),
        ...(profileData.address && { address: profileData.address }),
        ...(profileData.city && { city: profileData.city }),
        ...(profileData.state && { state: profileData.state }),
        ...(profileData.country && { country: profileData.country }),
        ...(profileData.postalCode && { postalCode: profileData.postalCode }),
        ...(profileData.description && {
          description: profileData.description,
        }),
        ...(profileData.businessType && {
          businessType: profileData.businessType,
        }),
        ...(profileData.taxId && { taxId: profileData.taxId }),
      },
    });

    return updatedCompany;
  }

  async requestVerification(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    });

    if (!user || !user.company) {
      throw new Error("Company not found");
    }

    // TODO: Implement verification request logic
    // For now, just return a success message
    return {
      status: "PENDING",
      message: "Verification request submitted successfully",
    };
  }

  async getDashboardStats(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    });

    if (!user || !user.company) {
      throw new Error("Company not found");
    }

    // Get company stats based on user role
    let stats = {};

    if (user.role === "SELLER") {
      const productCount = await prisma.product.count({
        where: { companyId: user.company.id },
      });

      const orderCount = await prisma.order.count({
        where: { sellerId: userId },
      });

      stats = {
        totalProducts: productCount,
        totalOrders: orderCount,
        isVerified: user.company.isVerified,
      };
    } else if (user.role === "BUYER") {
      const orderCount = await prisma.order.count({
        where: { buyerId: userId },
      });

      stats = {
        totalOrders: orderCount,
        isVerified: user.company.isVerified,
      };
    }

    return stats;
  }
}

module.exports = new CompanyService();
