import "server-only";

import { unstable_cache } from "next/cache";
import { buildMediaUrl } from "@/lib/media/asset-url";
import { prisma } from "@/lib/prisma";

export const CMS_BRANCH_IMAGES_CACHE_TAG = "cms-branch-images";

// 分支机构只保留一张图片：上传新图片时会替换掉旧的（见对应的
// admin route），所以这里只需要取最新的一条即可。

// 用 Next.js 自带的 Data Cache（而不是项目里那个自造的内存单例）：
// 管理端 Route Handler 和这里的 Server Component 属于不同的编译层，
// unstable_cache + revalidateTag 才能保证两侧读写的是同一份缓存。
const getCachedBranchImage = unstable_cache(
  async (): Promise<string | null> => {
    const image = await prisma.cmsBranchImage.findFirst({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      select: { imageRelativePath: true },
    });

    return image ? buildMediaUrl(image.imageRelativePath) : null;
  },
  ["cms-branch-image"],
  { tags: [CMS_BRANCH_IMAGES_CACHE_TAG] },
);

export async function getCmsBranchImage(): Promise<string | null> {
  return getCachedBranchImage();
}
