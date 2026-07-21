import { prisma } from "@/lib/prisma";

async function main() {
  const newsItems = [
    {
      title: "汉理新能源推出新一代混合动力系统",
      slug: "new-hybrid-power-system-2024",
      summary: "我们荣幸宣布推出最新一代混合动力系统，具有更高的效率和可靠性。",
      coverImage: "/images/home/home-bg-1.jpg",
      coverImageAlt: "混合动力系统",
      content: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "汉理新能源推出新一代混合动力系统，针对需要长续航、高功率的船舶，将发动机、发电机、储能系统与推进电机智能耦合。支持多种运行模式（纯电、发电直驱、联合驱动、智能充电）。",
              },
            ],
          },
        ],
      },
      contentText: "汉理新能源推出新一代混合动力系统，针对需要长续航、高功率的船舶，将发动机、发电机、储能系统与推进电机智能耦合。支持多种运行模式（纯电、发电直驱、联合驱动、智能充电）。",
      authorName: "汉理新能源",
      status: "PUBLISHED" as const,
      isFeatured: true,
      publishedAt: new Date("2024-12-15"),
    },
    {
      title: "与国际领先企业达成战略合作",
      slug: "strategic-partnership-announcement",
      summary: "汉理新能源与国际领先的海事企业签署战略合作协议。",
      coverImage: "/images/home/home-bg-1.jpg",
      coverImageAlt: "战略合作",
      content: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "汉理新能源荣幸宣布与国际领先的海事企业达成战略合作。这次合作将进一步加强我们在船舶新能源动力系统领域的技术创新和市场拓展。",
              },
            ],
          },
        ],
      },
      contentText: "汉理新能源荣幸宣布与国际领先的海事企业达成战略合作。这次合作将进一步加强我们在船舶新能源动力系统领域的技术创新和市场拓展。",
      authorName: "汉理新能源",
      status: "PUBLISHED" as const,
      isFeatured: false,
      publishedAt: new Date("2024-11-20"),
    },
    {
      title: "荣获行业创新奖",
      slug: "industry-innovation-award",
      summary: "汉理新能源因在船舶新能源技术方面的创新成就荣获行业创新奖。",
      coverImage: "/images/home/home-bg-1.jpg",
      coverImageAlt: "创新奖",
      content: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "在最近的行业年会上，汉理新能源因在船舶新能源动力系统领域的突出贡献和创新成就，荣获了2024年度行业创新奖。这是对我们技术研发团队的高度认可。",
              },
            ],
          },
        ],
      },
      contentText: "在最近的行业年会上，汉理新能源因在船舶新能源动力系统领域的突出贡献和创新成就，荣获了2024年度行业创新奖。这是对我们技术研发团队的高度认可。",
      authorName: "汉理新能源",
      status: "PUBLISHED" as const,
      isFeatured: false,
      publishedAt: new Date("2024-10-10"),
    },
  ];

  for (const item of newsItems) {
    const existing = await prisma.news.findUnique({
      where: { slug: item.slug },
    });

    if (!existing) {
      await prisma.news.create({
        data: item,
      });
      console.log(`✓ 创建新闻: ${item.title}`);
    } else {
      console.log(`- 新闻已存在: ${item.title}`);
    }
  }

  console.log("\n✓ 新闻数据导入完成");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
