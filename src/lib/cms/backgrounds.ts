import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export type CmsBackgroundLocationKey =
  | "HOMEPAGE"
  | "ABOUT_US"
  | "SOLUTIONS"
  | "PRODUCTS"
  | "APPLICATION_CASES"
  | "NEWS"
  | "CONTACT_US";

export type CmsBackground = {
  type: string;
  relativePath: string;
  filename: string;
  url: string;
};

export const CMS_BACKGROUNDS_CACHE_TAG = "cms-backgrounds";

const cdnDomain = process.env.QINIU_DOMAIN ?? "";

// 用 Next.js 自带的 Data Cache（而不是项目里那个自造的内存单例）：
// Route Handler 和 Server Component 属于不同的编译层，各自 import 到的
// 内存单例不是同一份实例，管理端清缓存清不到页面那一份。unstable_cache
// + revalidateTag 是框架层面的共享缓存，两侧读写的是同一份，失效才可靠。
const getCachedBackgrounds = unstable_cache(
  async (): Promise<Record<string, CmsBackground>> => {
    const backgrounds = await prisma.cmsBackgroundImage.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
    });

    return backgrounds.reduce(
      (acc, bg) => {
        acc[bg.location] = {
          type: bg.type,
          relativePath: bg.relativePath,
          filename: bg.filename,
          url: `${cdnDomain}/${bg.relativePath}`,
        };
        return acc;
      },
      {} as Record<string, CmsBackground>,
    );
  },
  ["cms-backgrounds"],
  { tags: [CMS_BACKGROUNDS_CACHE_TAG] },
);

export async function getCmsBackgrounds(): Promise<
  Record<string, CmsBackground>
> {
  return getCachedBackgrounds();
}

export async function getCmsBackground(
  location: CmsBackgroundLocationKey,
): Promise<CmsBackground | null> {
  const backgrounds = await getCmsBackgrounds();
  return backgrounds[location] ?? null;
}
