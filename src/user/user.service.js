const prisma = require("../shared/database/prisma.service");

class UserService {
  async getUserProfile(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        companyName: true,
        country: true,
        role: true,
        isActive: true,
        phoneVerified: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        company: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  async updateUserProfile(userId, profileData) {
    const { firstName, lastName, phone, companyName, country } = profileData;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phone && { phone }),
        ...(companyName && { companyName }),
        ...(country && { country }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        companyName: true,
        country: true,
        role: true,
        isActive: true,
        phoneVerified: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  async verifyEmail(userId) {
    // TODO: Implement email verification logic
    // For now, just mark as verified
    await prisma.user.update({
      where: { id: userId },
      data: { emailVerified: true },
    });

    return { verified: true };
  }

  async verifyPhone(userId) {
    // TODO: Implement phone verification logic
    // For now, just mark as verified
    await prisma.user.update({
      where: { id: userId },
      data: { phoneVerified: true },
    });

    return { verified: true };
  }
}

module.exports = new UserService();
