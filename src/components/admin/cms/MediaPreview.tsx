"use client";

import { Play, File, FileImage, FileVideo } from "lucide-react";

interface MediaPreviewProps {
  filename: string;
  type?: "image" | "video" | "document";
  url?: string;
  size?: "sm" | "md" | "lg";
}

export default function MediaPreview({
  filename,
  type,
  url,
  size = "md",
}: MediaPreviewProps) {
  const sizeClass = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
  }[size];

  // 判断文件类型
  const detectedType = type || detectFileType(filename);

  if (detectedType === "image" && url) {
    return (
      <div className={`relative overflow-hidden rounded-lg bg-gray-100 ${sizeClass}`}>
        <img
          src={url}
          alt={filename}
          className="h-full w-full object-cover"
          onError={(e) => {
            // 如果图片加载失败，显示占位符
            e.currentTarget.style.display = "none";
          }}
        />
      </div>
    );
  }

  if (detectedType === "video" && url) {
    return (
      <div className={`relative overflow-hidden rounded-lg bg-gray-900 ${sizeClass}`}>
        <video
          src={url}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <Play className="h-6 w-6 text-white" />
        </div>
      </div>
    );
  }

  if (detectedType === "document") {
    return (
      <div className={`flex items-center justify-center rounded-lg bg-gray-100 ${sizeClass}`}>
        <File className="h-8 w-8 text-gray-400" />
      </div>
    );
  }

  // 默认预览
  return (
    <div className={`flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 ${sizeClass}`}>
      {detectedType === "image" ? (
        <FileImage className="h-6 w-6 text-gray-400" />
      ) : detectedType === "video" ? (
        <FileVideo className="h-6 w-6 text-gray-400" />
      ) : (
        <File className="h-6 w-6 text-gray-400" />
      )}
      <span className="mt-1 truncate px-1 text-xs text-gray-500">{filename}</span>
    </div>
  );
}

function detectFileType(filename: string): "image" | "video" | "document" {
  const ext = filename.toLowerCase().split(".").pop() || "";

  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) {
    return "image";
  }
  if (["mp4", "webm", "ogg", "mov", "avi", "mkv"].includes(ext)) {
    return "video";
  }
  return "document";
}
