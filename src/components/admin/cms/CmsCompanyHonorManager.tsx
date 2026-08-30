"use client";

import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import FileUploadInput from "./FileUploadInput";
import MediaPreview from "./MediaPreview";

interface CompanyHonor {
  id: string;
  imageFilename: string;
  url?: string;
}

export default function CmsCompanyHonorManager() {
  const [honors, setHonors] = useState<CompanyHonor[]>([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchHonors();
  }, []);

  const fetchHonors = async () => {
    try {
      const res = await fetch("/api/admin/cms/company-honors");
      const data = await res.json();
      if (data.success || Array.isArray(data.data)) {
        setHonors(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch honors:", error);
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

      const res = await fetch("/api/admin/cms/company-honors", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        alert("荣誉图片添加成功");
        setFile(null);
        await fetchHonors();
      } else {
        alert(`添加失败: ${data.message || "未知错误"}`);
      }
    } catch (error) {
      alert(`错误: ${error}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (honorId: string) => {
    if (!confirm("确定要删除这个荣誉图片吗？")) return;

    try {
      const res = await fetch(`/api/admin/cms/company-honors?id=${honorId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("删除成功");
        await fetchHonors();
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
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">上传公司荣誉图片</h3>
        <form onSubmit={handleUpload} className="space-y-4">
          <FileUploadInput
            file={file}
            onChange={setFile}
            accept="image/*"
            label="荣誉证书/奖项图片"
            description="支持 JPG, PNG, WebP 等格式，最大 3MB"
          />

          <button
            type="submit"
            disabled={!file || uploading}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {uploading ? "上传中..." : "上传图片"}
          </button>
        </form>
      </div>

      {/* 荣誉图片列表 */}
      <div className="rounded-lg border border-gray-200 p-6">
        <h3 className="mb-6 text-lg font-semibold text-gray-900">荣誉图片列表</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {honors.length === 0 ? (
            <p className="col-span-full py-8 text-center text-gray-500">暂无荣誉图片</p>
          ) : (
            honors.map((honor) => (
              <div
                key={honor.id}
                className="group rounded-lg border border-gray-200 bg-white p-3 hover:shadow-md transition-shadow"
              >
                <div className="relative mb-3 overflow-hidden rounded-lg">
                  <MediaPreview
                    filename={honor.imageFilename}
                    type="image"
                    url={honor.url}
                    size="lg"
                  />
                </div>
                <p className="mb-3 truncate text-xs text-gray-500">{honor.imageFilename}</p>
                <button
                  onClick={() => handleDelete(honor.id)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
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
