import { z } from "zod";

import { assertSameOriginRequest } from "@/lib/admin-auth/csrf";
import { requireAdminActor } from "@/lib/admin-auth/require-admin-actor";
import { ApiError } from "@/lib/api/errors";
import { fail, ok } from "@/lib/api/response";
import { localizeWechatImages } from "@/lib/news/localize-wechat-images";
import {
  parseWechatArticle,
  WechatImportError,
} from "@/lib/news/wechat-import";

export const runtime = "nodejs";

const requestSchema = z.object({
  url: z
    .string()
    .trim()
    .min(
      1,
      "请粘贴微信公众号文章地址",
    )
    .max(
      2000,
      "微信公众号文章地址过长",
    ),
});

export async function POST(
  request: Request,
) {
  try {
    console.log("📌 [import-wechat] POST request received");

    await requireAdminActor();
    assertSameOriginRequest(request);

    const input =
      requestSchema.parse(
        await request.json(),
      );

    console.log("📌 [import-wechat] Parsing WeChat article:", input.url);

    const article =
      await parseWechatArticle(
        input.url,
      );

    console.log(
      "📌 [import-wechat] Article parsed, starting image localization",
      {
        title: article.title,
        remoteImages: article.remoteImages.length,
        remoteCoverImage: article.remoteCoverImage ? '✓' : '✗',
      }
    );

    const localized = await localizeWechatImages({
      content: article.content,
      remoteCoverImage: article.remoteCoverImage,
      remoteImages: article.remoteImages,
      articleTitle: article.title,
    });

    console.log(
      "📌 [import-wechat] Localization completed",
      {
        localizedImages: localized.localizedImages.length,
        failedImages: localized.failedImages.length,
      }
    );

    return ok({
      title:
        article.title,

      summary:
        article.summary,

      authorName:
        article.authorName,

      /*
       * 下一步下载图片并创建 MediaAsset。
       * 当前先不返回素材关联。
       */
      coverImageAssetId:
        localized.coverImageAsset?.id ??
        null,

      coverImageAsset:
      localized.coverImageAsset,

      coverImageAlt:
        article.title,

      content:
        localized.content,

      sourceType:
        article.sourceType,

      sourceUrl:
        article.sourceUrl,

      sourceAccountName:
        article.sourceAccountName,

      sourceArticleId:
        article.sourceArticleId,

      sourcePublishedAt:
        article.sourcePublishedAt,

      importMeta: {
        ...article.importMeta,

        imageLocalization: {
          localizedCount:
            localized.localizedImages.length,

          failedCount:
            localized.failedImages.length,

          localizedImages:
            localized.localizedImages,

          failedImages:
            localized.failedImages,
        },
      },
    });
  } catch (error) {
    if (error instanceof WechatImportError) {
      const apiErrorCode =
        error.code === "WECHAT_ACCESS_RESTRICTED"
          ? "RATE_LIMITED"
          : error.code === "WECHAT_ARTICLE_NOT_FOUND"
            ? "NOT_FOUND"
            : error.code === "WECHAT_RESPONSE_TOO_LARGE"
              ? "FILE_TOO_LARGE"
              : error.code === "WECHAT_FETCH_FAILED"
                ? "INTERNAL_SERVER_ERROR"
                : "BAD_REQUEST";

      return fail(
        new ApiError(
          apiErrorCode,
          error.message,
          error.status,
        ),
      );
    }

    return fail(error);
  }
}