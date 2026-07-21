import { describe, expect, it } from "vitest";
import { createAdminSessionToken, verifyAdminSessionToken } from "./session";

describe("admin session", () => {
  it("accepts a valid signed cookie", () => {
    process.env.ADMIN_SESSION_SECRET = "x".repeat(64);
    process.env.ADMIN_PASSWORD_HASH = "$2b$12$abcdefghijklmnopqrstuu5UxN8dDj7H0zWw.z8JHDZK.jnQ9q7Xa";
    process.env.ADMIN_SESSION_TTL_SECONDS = "28800";

    const token = createAdminSessionToken();
    expect(verifyAdminSessionToken(token)?.sub).toBe("admin");
  });

  it("rejects tampered cookies", () => {
    process.env.ADMIN_SESSION_SECRET = "x".repeat(64);
    process.env.ADMIN_PASSWORD_HASH = "$2b$12$abcdefghijklmnopqrstuu5UxN8dDj7H0zWw.z8JHDZK.jnQ9q7Xa";
    process.env.ADMIN_SESSION_TTL_SECONDS = "28800";

    const token = createAdminSessionToken();
    expect(verifyAdminSessionToken(`${token.slice(0, -2)}xx`)).toBeNull();
  });

  it("rejects expired cookies", () => {
    process.env.ADMIN_SESSION_SECRET = "x".repeat(64);
    process.env.ADMIN_PASSWORD_HASH = "$2b$12$abcdefghijklmnopqrstuu5UxN8dDj7H0zWw.z8JHDZK.jnQ9q7Xa";
    process.env.ADMIN_SESSION_TTL_SECONDS = "-1";

    expect(() => createAdminSessionToken()).toThrow();
  });
});
