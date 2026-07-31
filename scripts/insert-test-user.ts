import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // 生成密码哈希
  const hashedPassword = await bcrypt.hash("admin123456", 12);

  const testUser = await prisma.user.create({
    data: {
      username: "admin",
      email: "admin@hanli.com",
      password: hashedPassword,
      role: UserRole.SUPER_ADMIN,
      isActive: true,
    },
  });

  console.log("✓ Test user created successfully:");
  console.log(`  Username: ${testUser.username}`);
  console.log(`  Email: ${testUser.email}`);
  console.log(`  Role: ${testUser.role}`);
  console.log(`  Password: admin123456`);
}

main()
  .catch((e) => {
    console.error("Error creating user:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
