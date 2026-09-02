"use client";

import { useState, ChangeEvent, ReactNode } from "react";
import { Upload } from "lucide-react";

interface FileUploadInputProps {
  onChange: (file: File | null) => void;
  file: File | null;
  accept?: string;
  label?: string;
  description?: string;
  children?: ReactNode;
}

export default function FileUploadInput({
  onChange,
  file,
  accept = "*",
  label = "选择文件",
  description,
  children,
}: FileUploadInputProps) {
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles[0]) {
      onChange(droppedFiles[0]);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onChange(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">{label}</label>
      )}

      <label
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-8 transition-colors ${
          file
            ? "border-blue-300 bg-blue-50"
            : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50"
        }`}
      >
        <input
          type="file"
          onChange={handleChange}
          accept={accept}
          className="hidden"
        />

        {children ? (
          children
        ) : (
          <>
            <Upload className="mb-2 h-8 w-8 text-gray-400 group-hover:text-blue-500" />
            <p className="text-sm font-medium text-gray-900">
              拖拽文件到此或点击选择
            </p>
            {description && (
              <p className="mt-1 text-xs text-gray-500">{description}</p>
            )}
          </>
        )}
      </label>

      {file && (
        <div className="flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2">
          <span className="truncate text-sm text-gray-700">
            <span className="font-medium">{file.name}</span>
            <span className="ml-2 text-gray-500">
              ({(file.size / 1024 / 1024).toFixed(2)}MB)
            </span>
          </span>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-xs text-red-600 hover:text-red-700"
          >
            移除
          </button>
        </div>
      )}
    </div>
  );
}
