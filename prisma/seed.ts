import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

const pw = "changeme123"
const uname = "evay"
const em = "evay@hanli.com"

async function main() {
  // Create default super admin
  const hashedPassword = await bcrypt.hash(pw, 12);
  const admin = await prisma.user.upsert({
    where: { username: uname },
    update: {},
    create: {
      id: uuidv4(),
      username: uname,
      email: em,
      password: hashedPassword,
      role: UserRole.SUPER_ADMIN,
      isActive: true,
    },
  });
  console.log("✓ Default super admin created/updated");
  console.log(`  Username: ${admin.username}`);
  console.log(`  Email: ${admin.email}`);
  console.log(`  Role: ${admin.role}`);
  console.log(`  Temporary password: changeme123\n`);
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
