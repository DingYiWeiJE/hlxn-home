import { randomBytes } from "crypto";
import { hashAdminPassword } from "../src/lib/admin-auth/password";

async function main() {
  const password = process.argv[2];
  if (!password) {
    console.error("Usage: npm exec tsx scripts/generate-admin-credentials.ts -- <admin-password>");
    process.exit(1);
  }

  const hash = await hashAdminPassword(password);
  const secret = randomBytes(32).toString("base64url");

  console.log(`ADMIN_PASSWORD_HASH=${hash}`);
  console.log(`ADMIN_SESSION_SECRET=${secret}`);
}

void main();
