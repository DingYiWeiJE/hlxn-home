import { describe, expect, it } from "vitest";
import { assertSameOriginRequest } from "./csrf";

describe("csrf origin checks", () => {
  it("allows configured origin", () => {
    process.env.APP_ORIGIN = "https://example.com";
    const request = new Request("https://example.com/api/news", {
      method: "POST",
      headers: { origin: "https://example.com" },
    });

    expect(() => assertSameOriginRequest(request)).not.toThrow();
  });

  it("rejects different origin", () => {
    process.env.APP_ORIGIN = "https://example.com";
    const request = new Request("https://example.com/api/news", {
      method: "POST",
      headers: { origin: "https://evil.example" },
    });

    expect(() => assertSameOriginRequest(request)).toThrow("请求来源不被允许");
  });
});
