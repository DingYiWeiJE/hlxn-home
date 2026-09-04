import type { MediaAssetPurpose } from "@prisma/client";

export type UploadedAsset = {
  id: string;
  type: "IMAGE" | "PDF";
  url: string;
  relativePath: string;
  filename: string;
  originalName: string | null;
  mimeType: string;
  size: number;
  checksum: string | null;
  width: number | null;
  height: number | null;
  alt: string | null;
  purpose: MediaAssetPurpose;
  enabled: boolean;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UploadAssetOpts = {
  type: "IMAGE" | "PDF";
  purpose?: MediaAssetPurpose;
  alt?: string | null;
  width?: number;
  height?: number;
  onProgress?: (percent: number) => void;
};

type ApiFailurePayload = {
  success: false;
  error: {
    code: string;
    message: string;
    fieldErrors: Record<string, string[]>;
  };
};

type ApiSuccessPayload<T> = {
  success: true;
  data: T;
};

type ApiPayload<T> = ApiSuccessPayload<T> | ApiFailurePayload;

type TokenResponse = {
  token: string;
  key: string;
  uploadUrl: string;
};

function pickErrorMessage(payload: ApiPayload<unknown>): string {
  if (payload.success) {
    return "";
  }
  const firstField = Object.values(payload.error.fieldErrors).flat()[0];
  return firstField || payload.error.message || "上传失败";
}

async function requestJson<T>(
  input: string,
  init: RequestInit,
): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const payload = (await response.json()) as ApiPayload<T>;
  if (!response.ok || !payload.success) {
    throw new Error(pickErrorMessage(payload));
  }
  return payload.data;
}

function uploadToQiniuWithProgress(
  uploadUrl: string,
  token: string,
  key: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", uploadUrl);

    if (onProgress && xhr.upload) {
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(Math.min(percent, 99));
        }
      });
    }

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve();
        return;
      }
      let message = `七牛上传失败 (${xhr.status})`;
      try {
        const body = JSON.parse(xhr.responseText);
        if (body?.error) {
          message = `七牛上传失败：${body.error}`;
        }
      } catch {
        /* ignore JSON parse error */
      }
      reject(new Error(message));
    });

    xhr.addEventListener("error", () => {
      reject(new Error("网络错误，上传中断"));
    });

    xhr.addEventListener("abort", () => {
      reject(new Error("上传已取消"));
    });

    const formData = new FormData();
    formData.append("token", token);
    formData.append("key", key);
    formData.append("file", file, file.name);

    xhr.send(formData);
  });
}

export async function uploadAssetDirect(
  file: File,
  opts: UploadAssetOpts,
): Promise<UploadedAsset> {
  if (!(file instanceof File) || file.size <= 0) {
    throw new Error("请选择需要上传的文件");
  }

  const tokenPayload = await requestJson<TokenResponse>(
    "/api/admin/assets/upload-token",
    {
      method: "POST",
      body: JSON.stringify({
        type: opts.type,
        purpose: opts.purpose,
        filename: file.name,
        mimeType: file.type,
        size: file.size,
      }),
    },
  );

  await uploadToQiniuWithProgress(
    tokenPayload.uploadUrl,
    tokenPayload.token,
    tokenPayload.key,
    file,
    opts.onProgress,
  );

  const asset = await requestJson<UploadedAsset>(
    "/api/admin/assets/finalize",
    {
      method: "POST",
      body: JSON.stringify({
        type: opts.type,
        purpose: opts.purpose,
        key: tokenPayload.key,
        filename: file.name,
        originalName: file.name,
        alt: opts.alt ?? null,
        width: opts.width,
        height: opts.height,
      }),
    },
  );

  return asset;
}

export type BrochureLanguage = "zh" | "en";

export type UploadedBrochure = {
  id: string;
  language: BrochureLanguage;
  relativePath: string;
  filename: string;
  mimeType: string;
  size: number;
  createdAt: string;
  updatedAt: string;
};

export type UploadBrochureOpts = {
  language: BrochureLanguage;
  onProgress?: (percent: number) => void;
};

export async function uploadBrochureDirect(
  file: File,
  opts: UploadBrochureOpts,
): Promise<UploadedBrochure> {
  if (!(file instanceof File) || file.size <= 0) {
    throw new Error("请选择需要上传的文件");
  }

  const tokenPayload = await requestJson<TokenResponse>(
    "/api/admin/cms/brochures/upload-token",
    {
      method: "POST",
      body: JSON.stringify({
        language: opts.language,
        filename: file.name,
        mimeType: file.type,
        size: file.size,
      }),
    },
  );

  await uploadToQiniuWithProgress(
    tokenPayload.uploadUrl,
    tokenPayload.token,
    tokenPayload.key,
    file,
    opts.onProgress,
  );

  return requestJson<UploadedBrochure>(
    "/api/admin/cms/brochures/finalize",
    {
      method: "POST",
      body: JSON.stringify({
        language: opts.language,
        key: tokenPayload.key,
        filename: file.name,
      }),
    },
  );
}

export type BackgroundLocation =
  | "HOMEPAGE"
  | "ABOUT_US"
  | "SOLUTIONS"
  | "PRODUCTS"
  | "APPLICATION_CASES"
  | "NEWS"
  | "CONTACT_US";

export type BackgroundType = "image" | "video";

export type UploadedBackground = {
  id: string;
  location: BackgroundLocation;
  type: BackgroundType;
  relativePath: string;
  filename: string;
  mimeType: string;
  size: number;
  createdAt: string;
  updatedAt: string;
  url?: string;
};

export type UploadBackgroundOpts = {
  location: BackgroundLocation;
  type: BackgroundType;
  onProgress?: (percent: number) => void;
};

export async function uploadBackgroundDirect(
  file: File,
  opts: UploadBackgroundOpts,
): Promise<UploadedBackground> {
  if (!(file instanceof File) || file.size <= 0) {
    throw new Error("请选择需要上传的文件");
  }

  const tokenPayload = await requestJson<TokenResponse>(
    "/api/admin/cms/backgrounds/upload-token",
    {
      method: "POST",
      body: JSON.stringify({
        location: opts.location,
        type: opts.type,
        filename: file.name,
        mimeType: file.type,
        size: file.size,
      }),
    },
  );

  await uploadToQiniuWithProgress(
    tokenPayload.uploadUrl,
    tokenPayload.token,
    tokenPayload.key,
    file,
    opts.onProgress,
  );

  return requestJson<UploadedBackground>(
    "/api/admin/cms/backgrounds/finalize",
    {
      method: "POST",
      body: JSON.stringify({
        location: opts.location,
        type: opts.type,
        key: tokenPayload.key,
        filename: file.name,
      }),
    },
  );
}
