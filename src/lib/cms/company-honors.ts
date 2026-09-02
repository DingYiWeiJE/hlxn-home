import "server-only";

import { unstable_cache } from "next/cache";
import { buildMediaUrl } from "@/lib/media/asset-url";
import { prisma } from "@/lib/prisma";

export const CMS_COMPANY_HONORS_CACHE_TAG = "cms-company-honors";

// 用 Next.js 自带的 Data Cache（而不是项目里那个自造的内存单例）：
// 管理端 Route Handler 和这里的 Server Component 属于不同的编译层，
// unstable_cache + revalidateTag 才能保证两侧读写的是同一份缓存。
const getCachedCompanyHonors = unstable_cache(
  async (): Promise<string[]> => {
    const honors = await prisma.cmsCompanyHonor.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      select: { imageRelativePath: true },
    });

    return honors.map((honor) => buildMediaUrl(honor.imageRelativePath));
  },
  ["cms-company-honors"],
  { tags: [CMS_COMPANY_HONORS_CACHE_TAG] },
);

export async function getCmsCompanyHonors(): Promise<string[]> {
  return getCachedCompanyHonors();
}
