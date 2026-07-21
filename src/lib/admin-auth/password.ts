import bcrypt from "bcryptjs";

export function verifyAdminPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function hashAdminPassword(password: string) {
  return bcrypt.hash(password, 12);
}
