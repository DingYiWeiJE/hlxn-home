import { describe, expect, it } from "vitest";
import { resolveUploadPath } from "./paths";

describe("media paths", () => {
  it("resolves paths inside UPLOAD_ROOT", () => {
    process.env.UPLOAD_ROOT = "./tmp/uploads";
    const resolved = resolveUploadPath("news/2026/07/a.webp");
    expect(resolved.relativePath).toBe("news/2026/07/a.webp");
  });

  it("rejects traversal", () => {
    process.env.UPLOAD_ROOT = "./tmp/uploads";
    expect(() => resolveUploadPath("../secret")).toThrow();
  });
});
