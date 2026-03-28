// 1. Load the environment variables FIRST
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');

// 2. Initialize Prisma (it will automatically find DATABASE_URL from dotenv)
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding started...");
  console.log("Database URL is:", process.env.DATABASE_URL);

  // Example: 
  // const newMember = await prisma.member.create({
  //   data: {
  //     name: 'Alice',
  //     email: 'alice@example.com'
  //   }
  // });
  // console.log("Created member:", newMember);

  console.log("✅ Seeding finished.");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });