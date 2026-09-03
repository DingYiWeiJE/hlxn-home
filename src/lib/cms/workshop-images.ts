import "server-only";

import { unstable_cache } from "next/cache";
import { buildMediaUrl } from "@/lib/media/asset-url";
import { prisma } from "@/lib/prisma";

export const CMS_WORKSHOP_IMAGES_CACHE_TAG = "cms-workshop-images";

// 用 Next.js 自带的 Data Cache（而不是项目里那个自造的内存单例）：
// 管理端 Route Handler 和这里的 Server Component 属于不同的编译层，
// unstable_cache + revalidateTag 才能保证两侧读写的是同一份缓存。
const getCachedWorkshopImages = unstable_cache(
  async (): Promise<string[]> => {
    const images = await prisma.cmsWorkshopImage.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      select: { imageRelativePath: true },
    });

    return images.map((image) => buildMediaUrl(image.imageRelativePath));
  },
  ["cms-workshop-images"],
  { tags: [CMS_WORKSHOP_IMAGES_CACHE_TAG] },
);

export async function getCmsWorkshopImages(): Promise<string[]> {
  return getCachedWorkshopImages();
}
