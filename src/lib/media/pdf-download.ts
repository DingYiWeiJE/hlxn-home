import "server-only";

/**
 * 清理 ASCII 备用文件名，防止响应头注入。
 */
export function createAsciiFilename(filename: string): string {
  const extension = filename.toLowerCase().endsWith(".pdf") ? ".pdf" : "";

  const baseName = filename
    .replace(/\.pdf$/i, "")
    .replace(/[\r\n"]/g, "")
    .replace(/[^\x20-\x7E]/g, "_")
    .replace(/[\\/:*?<>|]/g, "_")
    .trim();

  return `${baseName || "document"}${extension || ".pdf"}`;
}

/**
 * 对 UTF-8 文件名进行 RFC 5987 编码。
 */
export function encodeDownloadFilename(filename: string): string {
  return encodeURIComponent(filename).replace(
    /['()*]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

export function createDownloadHeaders(input: {
  fileSize: number;
  downloadName: string;
  disposition: "attachment" | "inline";
}) {
  const asciiFilename = createAsciiFilename(input.downloadName);
  const encodedFilename = encodeDownloadFilename(input.downloadName);

  return {
    "Content-Type": "application/pdf",
    "Content-Length": String(input.fileSize),
    "Content-Disposition":
      `${input.disposition}; filename="${asciiFilename}"; ` +
      `filename*=UTF-8''${encodedFilename}`,
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  };
}

export function resolveDisposition(
  request: Request,
): "attachment" | "inline" {
  const { searchParams } = new URL(request.url);

  return searchParams.get("mode") === "view" ? "inline" : "attachment";
}

/**
 * 服务端拉取七牛文件内容后直接转发，而非重定向，
 * 这样 Content-Disposition 才会作用于浏览器实际收到的响应。
 */
export async function fetchQiniuFile(url: string) {
  const originalEnv = process.env.NODE_TLS_REJECT_UNAUTHORIZED;

  try {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

    return await fetch(url, {
      redirect: "follow",
    });
  } finally {
    if (originalEnv !== undefined) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalEnv;
    } else {
      delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    }
  }
}
