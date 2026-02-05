const bcrypt = require("bcryptjs");
const prisma = require("../shared/database/prisma.service");
const { generateToken } = require("../shared/utils/jwt");

class AuthService {
  async register(registerData) {
    try {
      const { email, phone, firstName, lastName, companyName, country } =
        registerData;

      // Validate required fields
      if (!email || !firstName || !lastName || !companyName || !country) {
        throw new Error("All required fields must be provided");
      }

      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ email }, { phone }].filter(Boolean), // Filter out undefined phone
        },
      });

      if (existingUser) {
        throw new Error("User already exists with this email or phone number");
      }

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          phone: phone || null, // Handle case where phone might be undefined
          firstName,
          lastName,
          companyName,
          country,
          password: await bcrypt.hash("temp123", 12),
          isActive: false,
          role: "BUYER",
        },
      });

      // Generate OTP
      const isIndia = country.toLowerCase() === "india";
      const verificationMethod = isIndia ? "PHONE" : "EMAIL";
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      console.log(`🔐 REGISTRATION OTP for ${verificationMethod}:`, otp);
      console.log(`📧 Email: ${email}${phone ? `, 📞 Phone: ${phone}` : ""}`);

      await prisma.verificationOTP.create({
        data: {
          userId: user.id,
          otp: otp,
          type: verificationMethod,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        },
      });

      return {
        userId: user.id,
        requiresOtp: true,
        verificationMethod: verificationMethod,
        ...(process.env.NODE_ENV === "development" && { debugOtp: otp }),
      };
    } catch (error) {
      console.error("💥 AuthService register error:", error);
      throw error; // Re-throw to be handled by controller
    }
  }

  async login(loginData) {
    try {
      const { phone, email, country } = loginData;

      // Validate input
      if (!country) {
        throw new Error("Country is required");
      }

      let user;
      let verificationMethod;
      const isIndia = country.toLowerCase() === "india";

      // FIXED: Use correct field names and remove roles reference
      if (isIndia && phone) {
        user = await prisma.user.findFirst({ 
          where: { 
            phone: phone
          } 
        });
        verificationMethod = "PHONE";
      } else if (email) {
        user = await prisma.user.findFirst({ 
          where: { 
            email: email
          }
        });
        verificationMethod = "EMAIL";
      } else {
        throw new Error(
          isIndia
            ? "Phone number is required for Indian users"
            : "Email is required for international users"
        );
      }

      if (!user) {
        throw new Error("No account found with the provided credentials");
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      console.log(`🔐 LOGIN OTP for ${verificationMethod}:`, otp);
      console.log(
        `📍 ${
          verificationMethod === "PHONE" ? "Phone: " + phone : "Email: " + email
        }`
      );

      await prisma.verificationOTP.create({
        data: {
          userId: user.id,
          otp: otp,
          type: verificationMethod,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
      });

      return {
        userId: user.id,
        requiresOtp: true,
        verificationMethod: verificationMethod,
        ...(process.env.NODE_ENV === "development" && { debugOtp: otp }),
      };
    } catch (error) {
      console.error("💥 AuthService login error:", error);
      throw error;
    }
  }

  async verifyOtp(verifyData) {
    try {
      const { userId, otp } = verifyData;

      // Validate input
      if (!userId || !otp) {
        throw new Error("User ID and OTP are required");
      }

      const otpRecord = await prisma.verificationOTP.findFirst({
        where: {
          userId: userId,
          otp: otp,
          expiresAt: { gt: new Date() },
          used: false,
        },
      });

      if (!otpRecord) {
        throw new Error("Invalid or expired OTP");
      }

      // Mark OTP as used
      await prisma.verificationOTP.update({
        where: { id: otpRecord.id },
        data: { used: true },
      });

      // Update user verification status
      const updateData = {
        isActive: true,
      };

      if (otpRecord.type === "PHONE") {
        updateData.phoneVerified = true;
      } else {
        updateData.emailVerified = true;
      }

      const user = await prisma.user.update({
        where: { id: userId },
        data: updateData,
      });

      // Generate token
      const token = generateToken({ userId: user.id });
      const { password, ...userData } = user;

      console.log(`✅ OTP verified successfully for user: ${user.id}`);

      return {
        user: userData,
        token,
      };
    } catch (error) {
      console.error("💥 AuthService verifyOtp error:", error);
      throw error;
    }
  }

  async getProfile(userId) {
    try {
      if (!userId) {
        throw new Error("User ID is required");
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error("User not found");
      }

      // Return user data without password
      const { password, ...userData } = user;
      return userData;
    } catch (error) {
      console.error("💥 AuthService getProfile error:", error);
      throw error;
    }
  }
}

module.exports = new AuthService();