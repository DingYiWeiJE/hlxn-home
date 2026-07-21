import { describe, expect, it } from "vitest";
import { isLoginRateLimited, recordLoginFailure } from "./rate-limit";

describe("login rate limit", () => {
  it("limits after repeated failures", () => {
    const key = `test-${Date.now()}`;
    for (let i = 0; i < 10; i += 1) {
      recordLoginFailure(key);
    }
    expect(isLoginRateLimited(key)).toBe(true);
  });
});
