import { describe, expect, it } from "vitest";
import { extractImageUrlsFromTiptapJson, extractTextFromTiptapJson, validateTiptapDocument } from "./tiptap";

const doc = {
  type: "doc",
  content: [
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "标题" }] },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "正文" },
        { type: "text", text: "加粗", marks: [{ type: "bold" }] },
      ],
    },
    { type: "image", attrs: { src: "/media/news/2026/07/demo.webp", alt: "demo" } },
  ],
};

describe("tiptap utilities", () => {
  it("validates supported documents", () => {
    expect(validateTiptapDocument(doc).type).toBe("doc");
  });

  it("extracts plain text", () => {
    expect(extractTextFromTiptapJson(validateTiptapDocument(doc))).toContain("标题 正文加粗");
  });

  it("extracts image urls", () => {
    expect(extractImageUrlsFromTiptapJson(validateTiptapDocument(doc))).toEqual(["/media/news/2026/07/demo.webp"]);
  });

  it("rejects javascript links", () => {
    expect(() =>
      validateTiptapDocument({
        type: "doc",
        content: [{ type: "paragraph", content: [{ type: "text", text: "x", marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }] }] }],
      }),
    ).toThrow();
  });

  it("rejects data images", () => {
    expect(() => validateTiptapDocument({ type: "doc", content: [{ type: "image", attrs: { src: "data:image/png;base64,xx" } }] })).toThrow();
  });
});
