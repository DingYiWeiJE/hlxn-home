import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const news = await prisma.news.findMany({
    where: {
      slug: 'industry-innovation-award'
    },
    select: {
      id: true,
      slug: true,
      locale: true,
      title: true
    }
  });

  console.log('找到的新闻记录：');
  console.log(JSON.stringify(news, null, 2));

  await prisma.$disconnect();
}

main().catch(console.error);
