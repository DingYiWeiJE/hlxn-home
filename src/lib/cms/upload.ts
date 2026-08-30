import { uploadImage } from "@/lib/media/upload";
import { ApiError } from "@/lib/api/errors";

const CMS_MAX_IMAGE_SIZE = 3 * 1024 * 1024; // 3MB

export async function uploadCmsImage(
  file: File,
  scope: string,
  category: string,
  identifier: string,
  alt?: string
) {
  if (file.size > CMS_MAX_IMAGE_SIZE) {
    throw new ApiError(
      "FILE_TOO_LARGE",
      "图片不能超过 3 MB",
      413,
      {
        file: ["图片不能超过 3 MB"],
      }
    );
  }

  // 创建临时文件对象用于上传
  const tempFile = new File([await file.arrayBuffer()], file.name, {
    type: file.type,
  });

  // 使用通用上传函数
  const asset = await uploadImage(tempFile, {
    scope: "cms" as any,
    alt,
  });

  return asset;
}

export function generateCmsImagePath(
  category: string,
  type: string,
  identifier: string,
  extension: string
): string {
  return `cms/${category}/${type}/${identifier}.${extension}`;
}
