"use client";

import { useState, useEffect } from "react";
import { Trash2, FileText } from "lucide-react";
import FileUploadInput from "./FileUploadInput";
import {
  uploadBrochureDirect,
  type BrochureLanguage,
} from "@/lib/qiniu/upload-client";

interface Brochure {
  id: string;
  language: string;
  filename: string;
}

export default function CmsBrochureManager() {
  const [brochures, setBrochures] = useState<Brochure[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] =
    useState<BrochureLanguage>("zh");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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
    setUploadProgress(0);
    try {
      await uploadBrochureDirect(file, {
        language: selectedLanguage,
        onProgress: setUploadProgress,
      });
      alert("上传成功！旧文件已自动覆盖");
      setFile(null);
      await fetchBrochures();
    } catch (error) {
      alert(
        `上传失败: ${
          error instanceof Error ? error.message : "未知错误"
        }`,
      );
    } finally {
      setUploading(false);
      setUploadProgress(0);
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
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">上传企业画册</h3>
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">语言</label>
              <select
                value={selectedLanguage}
                onChange={(e) =>
                  setSelectedLanguage(e.target.value as BrochureLanguage)
                }
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="zh">中文</option>
                <option value="en">英文</option>
              </select>
            </div>
          </div>

          <FileUploadInput
            file={file}
            onChange={setFile}
            accept="application/pdf"
            label="企业画册 PDF 文件"
            description="仅支持 PDF 格式"
          />

          {uploading && (
            <div className="space-y-1">
              <div className="h-2 w-full overflow-hidden rounded-full bg-blue-100">
                <div
                  className="h-full bg-blue-600 transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500">
                {uploadProgress < 100
                  ? `上传中 ${uploadProgress}%`
                  : "处理中..."}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={!file || uploading}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {uploading ? "上传中..." : "上传画册"}
          </button>
        </form>
      </div>

      {/* 当前画册列表 */}
      <div className="rounded-lg border border-gray-200 p-6">
        <h3 className="mb-6 text-lg font-semibold text-gray-900">当前画册</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {brochures.length === 0 ? (
            <p className="col-span-full py-8 text-center text-gray-500">暂无画册</p>
          ) : (
            brochures.map((brochure) => (
              <div
                key={brochure.id}
                className="rounded-lg border border-gray-200 bg-white p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-gradient-to-br from-red-100 to-orange-100">
                    <FileText className="h-10 w-10 text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">
                      {brochure.language === "zh" ? "🇨🇳 中文" : "🇬🇧 英文"}企业画册
                    </p>
                    <p className="mt-1 truncate text-sm text-gray-500">{brochure.filename}</p>
                    <p className="mt-2 text-xs text-gray-400">PDF 文档</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(brochure.language)}
                  className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors"
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
