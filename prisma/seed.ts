import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const content = (image: string) => ({
  type: "doc",
  content: [
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "项目进展" }] },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "这是一条用于展示新闻正文结构的示例内容，包含 " },
        { type: "text", text: "重点信息", marks: [{ type: "bold" }] },
        { type: "text", text: " 和图文节点。" },
      ],
    },
    {
      type: "bulletList",
      content: [
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "支持 H2、段落和列表" }] }] },
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "图片 URL 使用 /media/ 前缀" }] }] },
      ],
    },
    { type: "blockquote", content: [{ type: "paragraph", content: [{ type: "text", text: "示例图片仅用于说明数据格式。" }] }] },
    { type: "image", attrs: { src: image, alt: "示例图片" } },
  ],
});

async function main() {
  const now = new Date();
  const rows = [
    ["公司新闻示例一", "demo-news-1", "/media/news/demo/example-1.webp"],
    ["公司新闻示例二", "demo-news-2", "/media/news/demo/example-1.webp"],
    ["公司新闻示例三", "demo-news-3", "/media/news/demo/example-1.webp"],
  ] as const;

  for (const [title, slug, image] of rows) {
    await prisma.news.upsert({
      where: { slug },
      update: {},
      create: {
        title,
        slug,
        summary: "这是一条新闻 seed 数据，用于本地开发和页面验证。",
        coverImage: image,
        coverImageAlt: "示例图片",
        content: content(image),
        contentText: "项目进展 这是一条用于展示新闻正文结构的示例内容，包含重点信息和图文节点。支持 H2、段落和列表 图片 URL 使用 /media/ 前缀 示例图片仅用于说明数据格式。",
        authorName: "Hanli Chuneng",
        status: "PUBLISHED",
        isFeatured: slug === "demo-news-1",
        publishedAt: now,
      },
    });
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
