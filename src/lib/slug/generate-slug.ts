import "server-only";

import { pinyin } from "pinyin-pro";

type GenerateUniqueSlugOptions = {
  /**
   * 用于生成 Slug 的标题或名称。
   */
  source: string;

  /**
   * 查询候选 Slug 是否已经存在。
   */
  exists: (
    candidate: string,
  ) => Promise<boolean>;

  /**
   * Slug 最大长度。
   */
  maxLength?: number;

  /**
   * 最多尝试多少个数字后缀。
   */
  maxAttempts?: number;
};

/**
 * 将中文、英文或混合文本转换为 Slug。
 *
 * 示例：
 * 工商业储能系统
 * -> gong-shang-ye-chu-neng-xi-tong
 *
 * Industrial Energy Storage
 * -> industrial-energy-storage
 */
export function slugifyText(
  source: string,
  maxLength = 160,
): string {
  const normalizedSource = source.trim();

  if (!normalizedSource) {
    throw new Error(
      "无法根据空标题生成 Slug",
    );
  }

  const transliterated = pinyin(
    normalizedSource,
    {
      toneType: "none",
      type: "array",
    },
  ).join(" ");

  const slug = transliterated
    // 分解可能存在的重音字符
    .normalize("NFKD")

    // 删除重音标记
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )

    .toLowerCase()

    // 将 & 转换为可读单词
    .replace(/&/g, " and ")

    // 删除英文撇号
    .replace(/['’]/g, "")

    // 非字母数字字符统一转成中划线
    .replace(/[^a-z0-9]+/g, "-")

    // 合并连续中划线
    .replace(/-{2,}/g, "-")

    // 删除首尾中划线
    .replace(/^-+|-+$/g, "")

    // 限制长度
    .slice(0, maxLength)

    // 截断后再次清理末尾中划线
    .replace(/-+$/g, "");

  if (slug) {
    return slug;
  }

  // 极端情况下名称只有特殊符号时，
  // 使用时间戳生成可用地址。
  return `content-${Date.now().toString(
    36,
  )}`.slice(0, maxLength);
}

/**
 * 生成数据库中唯一的 Slug。
 *
 * 重复时自动生成：
 * product-name
 * product-name-2
 * product-name-3
 */
export async function generateUniqueSlug({
  source,
  exists,
  maxLength = 160,
  maxAttempts = 999,
}: GenerateUniqueSlugOptions): Promise<string> {
  const baseSlug = slugifyText(
    source,
    maxLength,
  );

  for (
    let attempt = 1;
    attempt <= maxAttempts;
    attempt += 1
  ) {
    const suffix =
      attempt === 1
        ? ""
        : `-${attempt}`;

    const availableBaseLength =
      maxLength - suffix.length;

    const trimmedBase = baseSlug
      .slice(
        0,
        Math.max(
          availableBaseLength,
          1,
        ),
      )
      .replace(/-+$/g, "");

    const candidate =
      `${trimmedBase}${suffix}`;

    const alreadyExists =
      await exists(candidate);

    if (!alreadyExists) {
      return candidate;
    }
  }

  throw new Error(
    `无法生成唯一 Slug，已尝试 ${maxAttempts} 次`,
  );
}