require("dotenv").config();
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const pool = require("./db");

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function createAdmin() {
  try {
    console.log("Clearing any broken data...");
    await prisma.admin.deleteMany();

    console.log("Hashing secure password...");
    // We are hashing the password so it is safely encrypted in PostgreSQL
    const hashedPassword = await bcrypt.hash("villageadmin2026", 10);
    
    console.log("Injecting Admin into PostgreSQL...");
    await prisma.admin.create({
      data: {
        email: "adminvillageapi@gmail.com", // 🚀 Using your actual email!
        password: hashedPassword
      }
    });

    console.log("✅ Success! Your database is no longer empty.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

createAdmin();