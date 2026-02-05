const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Reset & seed hierarchical categories (top-level only for now)

  const categoryNames = [
    "Agriculture",
    "Apparel & Fashion",
    "Fashion Accessories & Footwear",
    "Textiles, Fabrics & Raw Materials",
    "Beauty & Personal Care",
    "Health & Medical",
    "Pharmaceuticals & Lab Equipment",
    "Food & Beverages",
    "Home & Garden",
    "Furniture",
    "Home Appliances",
    "Consumer Electronics",
    "Computer & IT Products",
    "Electrical Equipment & Supplies",
    "Lights & Lighting",
    "Industrial Machinery & Equipment",
    "Tools & Hardware",
    "Marine & Offshore Equipments",
    "Building & Construction Materials",
    "Minerals, Metals & Alloys",
    "Rubber & Plastics",
    "Chemicals",
    "Energy & Power",
    "Renewable Energy",
    "Measurement & Testing Instruments",
    "Material Handling & Storage",
    "Packaging & Printing",
    "Paper & Pulp",
    "Office & School Supplies",
    "Gifts, Crafts & Decorations",
    "Toys, Kids & Baby Products",
    "Sports & Entertainment",
    "Books, Music & Art",
    "Security & Protection",
    "Safety Equipment",
    "Aviation & Aerospace",
    "Smart Living & IoT Devices",
    "Telecommunication",
    "Vehicles & Transportation",
    "Vehicle Parts & Accessories",
    "Luggage, Bags & Cases",
    "Jewelry, Watches & Eyewear",
    "Pet Supplies",
    "Cleaning & Sanitation Products",
    "Religious & Cultural Articles",
    "Environmental Equipment",
    "Diagnostic & Imaging Devices",
    "Power Transmission & Electrical Parts",
    "Umbrella & Rainwear",
    "Collectibles & Antiques",
  ];

  function slugify(name) {
    return name
      .toLowerCase()
      .trim()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  const categories = [];
  for (const name of categoryNames) {
    const cat = await prisma.category.upsert({
      where: { slug: slugify(name) },
      update: {},
      create: {
        name,
        slug: slugify(name),
        depth: 0,
      },
    });
    categories.push(cat);
  }

  console.log("✅ Top-level categories seeded (" + categories.length + ")");

  // Add subcategories for popular main categories
  const subcategoryMap = {
    "Consumer Electronics": [
      "Mobile Phones",
      "Laptops & Computers",
      "Audio & Video",
      "Cameras & Photography",
      "Wearable Technology",
    ],
    Agriculture: [
      "Seeds & Plants",
      "Fertilizers",
      "Farm Equipment",
      "Irrigation Systems",
      "Animal Feed",
    ],
    "Apparel & Fashion": [
      "Men's Clothing",
      "Women's Clothing",
      "Kids' Clothing",
      "Sportswear",
      "Formal Wear",
    ],
    "Food & Beverages": [
      "Processed Foods",
      "Beverages",
      "Snacks",
      "Dairy Products",
      "Organic Foods",
    ],
    "Industrial Machinery & Equipment": [
      "Manufacturing Equipment",
      "Construction Machinery",
      "Mining Equipment",
      "Food Processing Machines",
      "Textile Machinery",
    ],
    "Building & Construction Materials": [
      "Cement & Concrete",
      "Steel & Metal",
      "Wood & Timber",
      "Paints & Coatings",
      "Tiles & Flooring",
    ],
    Chemicals: [
      "Industrial Chemicals",
      "Agricultural Chemicals",
      "Specialty Chemicals",
      "Laboratory Chemicals",
      "Cleaning Chemicals",
    ],
    "Textiles, Fabrics & Raw Materials": [
      "Cotton Fabrics",
      "Synthetic Fabrics",
      "Yarn & Thread",
      "Leather",
      "Raw Cotton",
    ],
    "Home Appliances": [
      "Kitchen Appliances",
      "Cooling & Heating",
      "Washing & Cleaning",
      "Air Quality",
      "Small Appliances",
    ],
    "Electrical Equipment & Supplies": [
      "Wires & Cables",
      "Switches & Sockets",
      "Transformers",
      "Circuit Breakers",
      "LED & Lighting Components",
    ],
  };

  let subcategoryCount = 0;
  for (const [parentName, children] of Object.entries(subcategoryMap)) {
    const parent = categories.find((c) => c.name === parentName);
    if (!parent) continue;

    for (const childName of children) {
      await prisma.category.upsert({
        where: { slug: slugify(childName) },
        update: {},
        create: {
          name: childName,
          slug: slugify(childName),
          parentId: parent.id,
          depth: 1,
        },
      });
      subcategoryCount++;
    }
  }

  console.log(
    `✅ Subcategories seeded (${subcategoryCount} items under 10 main categories)`
  );

  // Create sample buyer
  const buyer = await prisma.user.upsert({
    where: { email: "buyer@example.com" },
    update: {},
    create: {
      email: "buyer@example.com",
      password: await bcrypt.hash("password123", 12),
      firstName: "John",
      lastName: "Buyer",
      companyName: "Buyer Corp",
      country: "USA",
      role: "BUYER",
      isActive: true,
      emailVerified: true,
    },
  });

  // Create sample seller and company
  const company = await prisma.company.upsert({
    where: { name: "Seller Inc" },
    update: {},
    create: {
      name: "Seller Inc",
      email: "seller@example.com",
      phone: "+1234567890",
      address: "123 Business St",
      city: "New York",
      country: "USA",
      businessType: "Manufacturer",
      isVerified: true,
    },
  });

  const seller = await prisma.user.upsert({
    where: { email: "seller@example.com" },
    update: {},
    create: {
      email: "seller@example.com",
      password: await bcrypt.hash("password123", 12),
      firstName: "Jane",
      lastName: "Seller",
      companyName: "Seller Inc",
      country: "USA",
      role: "SELLER",
      isActive: true,
      emailVerified: true,
      companyId: company.id,
    },
  });

  console.log("✅ Sample users created");

  // Create sample products
  const products = await Promise.all([
    prisma.product.upsert({
      where: { sku: "MCU-IND-001" },
      update: {},
      create: {
        name: "Industrial Microcontroller",
        description:
          "High-performance microcontroller for industrial applications",
        price: 45.99,
        sku: "MCU-IND-001",
        stock: 100,
        status: "ACTIVE",
        categoryId: categories[0].id,
        userId: seller.id,
        companyId: company.id,
      },
    }),
    prisma.product.upsert({
      where: { sku: "AL-SHT-001" },
      update: {},
      create: {
        name: "Aluminum Sheets",
        description: "Premium quality aluminum sheets for manufacturing",
        price: 125.5,
        sku: "AL-SHT-001",
        stock: 50,
        status: "ACTIVE",
        categoryId: categories[1].id,
        userId: seller.id,
        companyId: company.id,
      },
    }),
  ]);

  console.log("✅ Sample products created");

  // Create sample RFQs for Live Enquiries
  const rfqCategories = [
    "Industrial Machinery & Equipment",
    "Consumer Electronics",
    "Building & Construction Materials",
    "Agriculture",
    "Food & Beverages",
    "Textiles, Fabrics & Raw Materials",
    "Chemicals",
    "Electrical Equipment & Supplies",
  ];

  const rfqTitles = [
    {
      title: "Industrial Steel Pipes",
      quantity: 500,
      unit: "MT",
      category: "Building & Construction Materials",
      budget: 50000,
    },
    {
      title: "High Capacity Power Generators",
      quantity: 10,
      unit: "units",
      category: "Industrial Machinery & Equipment",
      budget: 150000,
    },
    {
      title: "Organic Wheat Flour",
      quantity: 200,
      unit: "MT",
      category: "Food & Beverages",
      budget: 30000,
    },
    {
      title: "LED Street Lights",
      quantity: 1000,
      unit: "pieces",
      category: "Electrical Equipment & Supplies",
      budget: 45000,
    },
    {
      title: "Cotton Fabric Rolls",
      quantity: 5000,
      unit: "meters",
      category: "Textiles, Fabrics & Raw Materials",
      budget: 25000,
    },
    {
      title: "Industrial Grade Chemicals",
      quantity: 100,
      unit: "barrels",
      category: "Chemicals",
      budget: 35000,
    },
    {
      title: "Smart Surveillance Cameras",
      quantity: 500,
      unit: "pieces",
      category: "Consumer Electronics",
      budget: 80000,
    },
    {
      title: "Agricultural Tractors",
      quantity: 5,
      unit: "units",
      category: "Agriculture",
      budget: 200000,
    },
    {
      title: "Solar Panel Systems",
      quantity: 50,
      unit: "units",
      category: "Renewable Energy",
      budget: 120000,
    },
    {
      title: "Heavy Duty Construction Equipment",
      quantity: 3,
      unit: "units",
      category: "Industrial Machinery & Equipment",
      budget: 300000,
    },
    {
      title: "Plastic Raw Materials",
      quantity: 150,
      unit: "MT",
      category: "Rubber & Plastics",
      budget: 40000,
    },
    {
      title: "Medical Diagnostic Equipment",
      quantity: 20,
      unit: "units",
      category: "Health & Medical",
      budget: 180000,
    },
  ];

  const locations = [
    "Mumbai, India",
    "New York, USA",
    "Dubai, UAE",
    "London, UK",
    "Singapore",
    "Istanbul, Turkey",
    "Shanghai, China",
    "São Paulo, Brazil",
    "Toronto, Canada",
    "Sydney, Australia",
  ];

  const rfqs = [];
  for (let i = 0; i < rfqTitles.length; i++) {
    const rfqData = rfqTitles[i];
    const daysAgo = Math.floor(Math.random() * 5); // Random 0-5 days ago
    const hoursAgo = Math.floor(Math.random() * 24); // Random hours
    const createdAt = new Date(
      Date.now() - daysAgo * 24 * 60 * 60 * 1000 - hoursAgo * 60 * 60 * 1000
    );
    const deadlineDays = 7 + Math.floor(Math.random() * 30); // 7-37 days from creation

    const rfq = await prisma.rFQ.create({
      data: {
        rfqNumber: `RFQ-${Date.now()}-${i}`,
        title: rfqData.title,
        description: `Looking for high-quality ${rfqData.title.toLowerCase()} for our upcoming project. Must meet international standards and certifications. Bulk order with potential for long-term partnership.`,
        category: rfqData.category,
        quantity: rfqData.quantity,
        unit: rfqData.unit,
        preferredPrice: rfqData.budget / rfqData.quantity,
        deliveryLocation: locations[i % locations.length],
        timeline: `${Math.floor(Math.random() * 20 + 10)} days`,
        budget: rfqData.budget,
        deadline: new Date(
          createdAt.getTime() + deadlineDays * 24 * 60 * 60 * 1000
        ),
        status: "OPEN",
        buyerId: buyer.id,
        createdAt: createdAt,
      },
    });
    rfqs.push(rfq);
  }

  console.log(`✅ Sample RFQs created (${rfqs.length} items)`);

  // Create sample quotes for some RFQs
  const quotesData = [
    { rfqIndex: 0, priceOffer: 45000, moq: 450, deliveryTime: "15 days" },
    { rfqIndex: 0, priceOffer: 48000, moq: 500, deliveryTime: "10 days" },
    { rfqIndex: 1, priceOffer: 140000, moq: 8, deliveryTime: "30 days" },
    { rfqIndex: 2, priceOffer: 28000, moq: 180, deliveryTime: "20 days" },
    { rfqIndex: 3, priceOffer: 42000, moq: 900, deliveryTime: "25 days" },
  ];

  for (const quoteData of quotesData) {
    await prisma.quote.create({
      data: {
        rfqId: rfqs[quoteData.rfqIndex].id,
        sellerId: seller.id,
        priceOffer: quoteData.priceOffer,
        moq: quoteData.moq,
        deliveryTime: quoteData.deliveryTime,
        additionalNotes:
          "We are experienced supplier with ISO certification. Can provide samples upon request.",
        status: "SUBMITTED",
      },
    });
  }

  console.log("✅ Sample quotes created");

  console.log("🎉 Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("💥 Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
