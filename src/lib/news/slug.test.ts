import { describe, expect, it } from "vitest";
import { slugifyTitle } from "./slug";

describe("slugifyTitle", () => {
  it("generates ascii slugs", () => {
    expect(slugifyTitle("Hello News 2026!")).toBe("hello-news-2026");
  });

  it("does not return empty slug for Chinese titles", () => {
    expect(slugifyTitle("汉理储能新闻")).toMatch(/^news-[a-z0-9]+$/);
  });
});
