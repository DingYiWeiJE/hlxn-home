"use client";

import { useState, useEffect } from "react";

interface Brochure {
  id: string;
  language: string;
  filename: string;
}

export default function CmsBrochureManager() {
  const [brochures, setBrochures] = useState<Brochure[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState("zh");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchBrochures();
  }, []);

  const fetchBrochures = async () => {
    try {
      const res = await fetch("/api/admin/cms/brochures");
      const data = await res.json();
      if (data.success || Array.isArray(data.data)) {
        setBrochures(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch brochures:", error);
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
      formData.append("language", selectedLanguage);

      const res = await fetch("/api/admin/cms/brochures", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        alert("上传成功！旧文件已自动删除");
        setFile(null);
        await fetchBrochures();
      } else {
        alert(`上传失败: ${data.message || "未知错误"}`);
      }
    } catch (error) {
      alert(`上传错误: ${error}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (language: string) => {
    if (!confirm("确定要删除这个画册吗？")) return;

    try {
      const res = await fetch(`/api/admin/cms/brochures?language=${language}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("删除成功");
        await fetchBrochures();
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
        <h3 className="mb-4 text-lg font-semibold text-gray-900">上传企业画册</h3>
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">语言</label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 border"
            >
              <option value="zh">中文</option>
              <option value="en">英文</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              选择 PDF 文件（最大 3MB）
            </label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              accept="application/pdf"
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

      {/* 当前画册列表 */}
      <div className="rounded-lg border border-gray-200 p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">当前画册</h3>
        <div className="space-y-2">
          {brochures.length === 0 ? (
            <p className="text-gray-500">暂无画册</p>
          ) : (
            brochures.map((brochure) => (
              <div
                key={brochure.id}
                className="flex items-center justify-between rounded-lg bg-gray-50 p-4"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {brochure.language === "zh" ? "中文" : "英文"}企业画册
                  </p>
                  <p className="text-sm text-gray-500">{brochure.filename}</p>
                </div>
                <button
                  onClick={() => handleDelete(brochure.language)}
                  className="text-sm text-red-600 hover:text-red-700"
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
