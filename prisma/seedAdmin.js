const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function seedAdmin() {
  try {
    // Create default super admin
    const hashedPassword = await bcrypt.hash("admin123", 10);

    const admin = await prisma.admin.upsert({
      where: { email: "admin@list2ship.com" },
      update: {},
      create: {
        email: "admin@list2ship.com",
        password: hashedPassword,
        firstName: "Super",
        lastName: "Admin",
        role: "ADMIN",
        isActive: true,
        isSuperAdmin: true,
      },
    });

    console.log("✅ Admin seeded successfully:", admin.email);

    // Create default system settings
    const defaultSettings = [
      {
        key: "SITE_NAME",
        value: "List2Ship",
        category: "GENERAL",
        description: "Website name",
      },
      {
        key: "SITE_EMAIL",
        value: "support@list2ship.com",
        category: "GENERAL",
        description: "Support email",
      },
      {
        key: "ITEMS_PER_PAGE",
        value: "10",
        category: "GENERAL",
        description: "Default items per page",
      },
      {
        key: "MAINTENANCE_MODE",
        value: "false",
        category: "GENERAL",
        description: "Enable maintenance mode",
      },
      {
        key: "SMTP_HOST",
        value: "smtp.example.com",
        category: "EMAIL",
        description: "SMTP server host",
      },
      {
        key: "SMTP_PORT",
        value: "587",
        category: "EMAIL",
        description: "SMTP server port",
      },
      {
        key: "PAYMENT_GATEWAY",
        value: "stripe",
        category: "PAYMENT",
        description: "Default payment gateway",
      },
      {
        key: "MIN_ORDER_AMOUNT",
        value: "10",
        category: "PAYMENT",
        description: "Minimum order amount",
      },
      {
        key: "PASSWORD_MIN_LENGTH",
        value: "8",
        category: "SECURITY",
        description: "Minimum password length",
      },
      {
        key: "SESSION_TIMEOUT",
        value: "3600",
        category: "SECURITY",
        description: "Session timeout in seconds",
      },
    ];

    for (const setting of defaultSettings) {
      await prisma.systemSettings.upsert({
        where: { key: setting.key },
        update: {},
        create: setting,
      });
    }

    console.log("✅ System settings seeded successfully");
  } catch (error) {
    console.error("❌ Error seeding admin:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  seedAdmin();
}

module.exports = seedAdmin;
