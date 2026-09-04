"use client";

import {
  Upload,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Image from "next/image";
import { isQiniuUrl } from "@/lib/config";
import { uploadAssetDirect } from "@/lib/qiniu/upload-client";
import {
  type ChangeEvent,
  type FormEvent,
  useCallback,
  useRef,
  useState,
} from "react";

type ApplicationCaseImageUploaderProps = {
  imageAssetId: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  imageWidth: number | null;
  imageHeight: number | null;
  onImageAssetIdChange: (
    id: string | null,
    asset?: {
      url: string;
      alt: string | null;
      width: number | null;
      height: number | null;
    },
  ) => void;
  disabled?: boolean;
};

export default function ApplicationCaseImageUploader({
  imageAssetId,
  imageUrl,
  imageAlt,
  imageWidth,
  imageHeight,
  onImageAssetIdChange,
  disabled = false,
}: ApplicationCaseImageUploaderProps) {
  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const [uploading, setUploading] =
    useState(false);

  const [error, setError] = useState<
    string | null
  >(null);

  const [tempPreview, setTempPreview] =
    useState<string | null>(null);

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (
        ![
          "image/jpeg",
          "image/png",
          "image/webp",
        ].includes(file.type)
      ) {
        setError(
          "仅支持 JPG、PNG 和 WebP 格式",
        );

        return;
      }

      if (
        file.size > 10 * 1024 * 1024
      ) {
        setError(
          "文件大小不能超过 10MB",
        );

        return;
      }

      setError(null);
      setUploading(true);

      const reader = new FileReader();

      reader.onload = (e) => {
        setTempPreview(
          e.target?.result as string,
        );
      };

      reader.readAsDataURL(file);

      try {
        const asset = await uploadAssetDirect(file, {
          type: "IMAGE",
          purpose: "APPLICATION_CASE_IMAGE",
        });

        onImageAssetIdChange(asset.id, {
          url: asset.url,
          alt: asset.alt,
          width: asset.width,
          height: asset.height,
        });

        setTempPreview(asset.url);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "上传失败",
        );

        setTempPreview(null);
      } finally {
        setUploading(false);
      }
    },
    [onImageAssetIdChange],
  );

  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file =
        e.currentTarget.files?.[0];

      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();

      e.stopPropagation();

      const file =
        e.dataTransfer.files?.[0];

      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();

      e.stopPropagation();
    },
    [],
  );

  const hasImage =
    imageAssetId &&
    imageUrl &&
    !uploading;

  const previewUrl = tempPreview || imageUrl;

  const displayWidth =
    imageWidth || 400;

  const displayHeight =
    imageHeight || 300;

  const aspectRatio = displayHeight
    ? displayWidth / displayHeight
    : 4 / 3;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700">
          应用案例图片
          <span className="text-red-500">
            *
          </span>
        </label>

        {hasImage && (
          <button
            type="button"
            onClick={() =>
              onImageAssetIdChange(null)
            }
            disabled={disabled || uploading}
            className="text-xs text-red-600 hover:text-red-700 disabled:opacity-50"
          >
            清除
          </button>
        )}
      </div>

      {error && (
        <div className="flex gap-2 rounded-lg bg-red-50 p-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />

          <p className="text-sm text-red-800">
            {error}
          </p>
        </div>
      )}

      {previewUrl && (
        <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
          <div
            style={{
              aspectRatio: aspectRatio,
            }}
            className="relative w-full"
          >
            <Image
              src={previewUrl}
              alt="预览"
              fill
              className="object-cover"
              unoptimized={isQiniuUrl(previewUrl)}
            />

            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
            )}
          </div>
        </div>
      )}

      {!previewUrl && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() =>
            fileInputRef.current?.click()
          }
          className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-12 hover:border-slate-400 hover:bg-slate-100"
        >
          {uploading ? (
            <Loader2 className="mb-3 h-8 w-8 animate-spin text-slate-400" />
          ) : (
            <Upload className="mb-3 h-8 w-8 text-slate-400" />
          )}

          <p className="text-center text-sm font-medium text-slate-900">
            {uploading
              ? "上传中..."
              : "拖拽文件或点击选择"}
          </p>

          <p className="mt-1 text-center text-xs text-slate-500">
            支持 JPG、PNG 和 WebP
            格式，最大 10MB
          </p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        disabled={disabled || uploading}
        className="hidden"
      />
    </div>
  );
}
