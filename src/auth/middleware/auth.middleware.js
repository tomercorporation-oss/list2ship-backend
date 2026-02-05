const { verifyToken } = require("../../shared/utils/jwt");
const prisma = require("../../shared/database/prisma.service");

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided or invalid format",
      });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    // FIXED: Only use fields that exist in the schema
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        phoneVerified: true,
        emailVerified: true
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Invalid token or user not active",
      });
    }

    req.user = { userId: user.id, role: user.role };
    next();
  } catch (error) {
    console.error("💥 Authentication middleware error:", error);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

module.exports = { authenticate };