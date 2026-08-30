"use client";

import { useState, useEffect } from "react";

interface WorkshopImage {
  id: string;
  imageFilename: string;
  title: string | null;
}

export default function CmsWorkshopImageManager() {
  const [images, setImages] = useState<WorkshopImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingFile, setEditingFile] = useState<File | null>(null);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const res = await fetch("/api/admin/cms/workshop-images");
      const data = await res.json();
      if (data.success || Array.isArray(data.data)) {
        setImages(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch workshop images:", error);
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
      formData.append("title", title);

      const res = await fetch("/api/admin/cms/workshop-images", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        alert("生产车间图片添加成功");
        setFile(null);
        setTitle("");
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

  const handleUpdate = async (imageId: string) => {
    try {
      const formData = new FormData();
      formData.append("title", editingTitle);
      if (editingFile) {
        formData.append("file", editingFile);
      }

      const res = await fetch(`/api/admin/cms/workshop-images?id=${imageId}`, {
        method: "PUT",
        body: formData,
      });

      if (res.ok) {
        alert("更新成功");
        setEditingId(null);
        setEditingFile(null);
        await fetchImages();
      } else {
        alert("更新失败");
      }
    } catch (error) {
      alert(`错误: ${error}`);
    }
  };

  const handleDelete = async (imageId: string) => {
    if (!confirm("确定要删除这个生产车间图片吗？")) return;

    try {
      const res = await fetch(`/api/admin/cms/workshop-images?id=${imageId}`, {
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
        <h3 className="mb-4 text-lg font-semibold text-gray-900">上传生产车间图片</h3>
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

          <div>
            <label className="block text-sm font-medium text-gray-700">
              图片标题（可选）
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：车间A、生产线1"
              className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 border"
            />
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

      {/* 生产车间图片列表 */}
      <div className="rounded-lg border border-gray-200 p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">生产车间图片列表</h3>
        <div className="space-y-3">
          {images.length === 0 ? (
            <p className="text-gray-500">暂无生产车间图片</p>
          ) : (
            images.map((image) => (
              <div key={image.id} className="rounded-lg border border-gray-200 p-4">
                {editingId === image.id ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        图片标题
                      </label>
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        className="block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 border"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        更换图片（可选）
                      </label>
                      <input
                        type="file"
                        onChange={(e) => setEditingFile(e.target.files?.[0] || null)}
                        accept="image/*"
                        className="block w-full"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdate(image.id)}
                        className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                      >
                        保存
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-sm bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {image.title || "（无标题）"}
                      </p>
                      <p className="text-sm text-gray-500">{image.imageFilename}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingId(image.id);
                          setEditingTitle(image.title || "");
                        }}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(image.id)}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
