import * as qiniu from "qiniu";
import { ApiError } from "@/lib/api/errors";

function getQiniuConfig() {
  return {
    accessKey: process.env.QINIU_ACCESS_KEY!,
    secretKey: process.env.QINIU_SECRET_KEY!,
    bucket: process.env.QINIU_BUCKET!,
  };
}

export async function deleteFromQiniu(relativePath: string): Promise<void> {
  try {
    const config = getQiniuConfig();

    if (!config.accessKey || !config.secretKey || !config.bucket) {
      throw new Error("Missing Qiniu configuration");
    }

    const mac = new qiniu.auth.digest.Mac(
      config.accessKey,
      config.secretKey
    );

    const bucketManager = new qiniu.rs.BucketManager(
      mac,
      new qiniu.conf.Config()
    );

    // 使用 Promise 包装回调式的 deleteObject
    await new Promise<void>((resolve, reject) => {
      bucketManager.delete(
        config.bucket,
        relativePath,
        (err) => {
          if (err) {
            console.error("Failed to delete from Qiniu:", err);
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });

    console.log(`✅ Deleted from Qiniu: ${relativePath}`);
  } catch (error) {
    console.error("Error deleting from Qiniu:", error);
    throw new ApiError(
      "QINIU_DELETE_FAILED",
      "删除七牛云文件失败",
      500
    );
  }
}

export async function deleteMultipleFromQiniu(
  relativePaths: string[]
): Promise<void> {
  // 串行删除，避免并发问题
  for (const path of relativePaths) {
    await deleteFromQiniu(path);
  }
}
