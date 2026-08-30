"use client";

import { useState, useEffect } from "react";

interface BranchImage {
  id: string;
  imageFilename: string;
}

export default function CmsBranchImageManager() {
  const [images, setImages] = useState<BranchImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const res = await fetch("/api/admin/cms/branch-images");
      const data = await res.json();
      if (data.success || Array.isArray(data.data)) {
        setImages(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch branch images:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/cms/branch-images", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        alert("分支机构图片添加成功");
        setFile(null);
        await fetchImages();
      } else {
        alert(`添加失败: ${data.message || "未知错误"}`);
      }
    } catch (error) {
      alert(`错误: ${error}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (imageId: string) => {
    if (!confirm("确定要删除这个分支机构图片吗？")) return;

    try {
      const res = await fetch(`/api/admin/cms/branch-images?id=${imageId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("删除成功");
        await fetchImages();
      } else {
        alert("删除失败");
      }
    } catch (error) {
      alert(`删除错误: ${error}`);
    }
  };

  if (loading) {
    return <div className="text-center text-gray-500">加载中...</div>;
  }

  return (
    <div className="space-y-8">
      {/* 上传表单 */}
      <div className="rounded-lg border border-gray-200 p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">上传分支机构图片</h3>
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              选择图片（最大 3MB）
            </label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              accept="image/*"
              className="mt-1 block w-full"
            />
            {file && (
              <p className="mt-2 text-sm text-gray-500">
                选择文件: {file.name} ({(file.size / 1024 / 1024).toFixed(2)}MB)
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!file || uploading}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {uploading ? "上传中..." : "上传"}
          </button>
        </form>
      </div>

      {/* 图片列表 */}
      <div className="rounded-lg border border-gray-200 p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">分支机构图片</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {images.length === 0 ? (
            <p className="col-span-full text-gray-500">暂无分支机构图片</p>
          ) : (
            images.map((image) => (
              <div key={image.id} className="rounded-lg border border-gray-200 p-4">
                <p className="mb-3 truncate text-sm font-medium text-gray-900">
                  {image.imageFilename}
                </p>
                <button
                  onClick={() => handleDelete(image.id)}
                  className="w-full rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
                >
                  删除
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
