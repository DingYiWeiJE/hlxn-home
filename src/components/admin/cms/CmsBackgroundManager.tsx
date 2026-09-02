"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import FileUploadInput from "./FileUploadInput";
import MediaPreview from "./MediaPreview";

const LOCATIONS = [
  { value: "HOMEPAGE", label: "首页背景" },
  { value: "ABOUT_US", label: "关于我们背景" },
  { value: "SOLUTIONS", label: "解决方案背景" },
  { value: "PRODUCTS", label: "产品中心背景" },
  { value: "APPLICATION_CASES", label: "应用案例背景" },
  { value: "NEWS", label: "新闻中心背景" },
  { value: "CONTACT_US", label: "联系我们背景" },
];

interface Background {
  id: string;
  location: string;
  type: string;
  filename: string;
  url?: string;
}

export default function CmsBackgroundManager() {
  const router = useRouter();
  const [backgrounds, setBackgrounds] = useState<Background[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState("HOMEPAGE");
  const [selectedType, setSelectedType] = useState("image");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchBackgrounds();
  }, []);

  const fetchBackgrounds = async () => {
    try {
      const res = await fetch("/api/admin/cms/backgrounds");
      const data = await res.json();
      if (data.success || Array.isArray(data.data)) {
        setBackgrounds(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch backgrounds:", error);
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
      formData.append("location", selectedLocation);
      formData.append("type", selectedType);

      const res = await fetch("/api/admin/cms/backgrounds", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        alert("上传成功！旧文件已自动删除");
        setFile(null);
        await fetchBackgrounds();
      } else {
        alert(`上传失败: ${data.message || "未知错误"}`);
      }
    } catch (error) {
      alert(`上传错误: ${error}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (location: string) => {
    if (!confirm("确定要删除这个背景吗？")) return;

    try {
      const res = await fetch(`/api/admin/cms/backgrounds?location=${location}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("删除成功");
        await fetchBackgrounds();
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
        <h3 className="mb-4 text-lg font-semibold text-gray-900">上传背景图/视频</h3>
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">位置</label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {LOCATIONS.map((loc) => (
                  <option key={loc.value} value={loc.value}>
                    {loc.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">类型</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="image">图片</option>
                <option value="video">视频</option>
              </select>
            </div>
          </div>

          <FileUploadInput
            file={file}
            onChange={setFile}
            accept={selectedType === "image" ? "image/*" : "video/*"}
            label={selectedType === "image" ? "背景图片" : "背景视频"}
            description={`${selectedType === "image" ? "支持 JPG, PNG, WebP 等格式" : "支持 MP4, WebM 等格式"}，最大 3MB`}
          />

          <button
            type="submit"
            disabled={!file || uploading}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {uploading ? "上传中..." : "上传背景"}
          </button>
        </form>
      </div>

      {/* 当前背景列表 */}
      <div className="rounded-lg border border-gray-200 p-6">
        <h3 className="mb-6 text-lg font-semibold text-gray-900">当前背景</h3>
        <div className="space-y-3">
          {backgrounds.length === 0 ? (
            <p className="text-center py-8 text-gray-500">暂无背景</p>
          ) : (
            backgrounds.map((bg) => (
              <div
                key={bg.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <MediaPreview
                    filename={bg.filename}
                    type={bg.type === "image" ? "image" : "video"}
                    url={bg.url}
                    size="md"
                  />
                  <div>
                    <p className="font-medium text-gray-900">
                      {LOCATIONS.find((l) => l.value === bg.location)?.label}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {bg.type === "image" ? "📷 图片" : "🎬 视频"} • {bg.filename}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(bg.location)}
                  className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors"
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
