"use client";

import { useState, useEffect } from "react";
import { Trash2, Edit2, Check, X } from "lucide-react";
import FileUploadInput from "./FileUploadInput";
import MediaPreview from "./MediaPreview";

interface Partner {
  id: string;
  imageFilename: string;
  websiteUrl: string | null;
  url?: string;
}

export default function CmsPartnerManager() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingUrl, setEditingUrl] = useState("");

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      const res = await fetch("/api/admin/cms/partners");
      const data = await res.json();
      if (data.success || Array.isArray(data.data)) {
        setPartners(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch partners:", error);
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
      formData.append("websiteUrl", websiteUrl);

      const res = await fetch("/api/admin/cms/partners", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        alert("合作伙伴添加成功");
        setFile(null);
        setWebsiteUrl("");
        await fetchPartners();
      } else {
        alert(`添加失败: ${data.message || "未知错误"}`);
      }
    } catch (error) {
      alert(`错误: ${error}`);
    } finally {
      setUploading(false);
    }
  };

  const handleUpdate = async (partnerId: string) => {
    try {
      const formData = new FormData();
      formData.append("websiteUrl", editingUrl);

      const res = await fetch(`/api/admin/cms/partners?id=${partnerId}`, {
        method: "PUT",
        body: formData,
      });

      if (res.ok) {
        alert("更新成功");
        setEditingId(null);
        await fetchPartners();
      } else {
        alert("更新失败");
      }
    } catch (error) {
      alert(`错误: ${error}`);
    }
  };

  const handleDelete = async (partnerId: string) => {
    if (!confirm("确定要删除这个合作伙伴吗？")) return;

    try {
      const res = await fetch(`/api/admin/cms/partners?id=${partnerId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("删除成功");
        await fetchPartners();
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
      {/* 添加表单 */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">添加合作伙伴</h3>
        <form onSubmit={handleUpload} className="space-y-4">
          <FileUploadInput
            file={file}
            onChange={setFile}
            accept="image/*"
            label="合作伙伴标志"
            description="支持 JPG, PNG, WebP 等格式，最大 3MB，建议宽度至少 200px"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700">官网地址（可选）</label>
            <input
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://example.com"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={!file || uploading}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {uploading ? "添加中..." : "添加合作伙伴"}
          </button>
        </form>
      </div>

      {/* 合作伙伴列表 */}
      <div className="rounded-lg border border-gray-200 p-6">
        <h3 className="mb-6 text-lg font-semibold text-gray-900">合作伙伴列表</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {partners.length === 0 ? (
            <p className="col-span-full py-8 text-center text-gray-500">暂无合作伙伴</p>
          ) : (
            partners.map((partner) => (
              <div
                key={partner.id}
                className="rounded-lg border border-gray-200 bg-white p-4 hover:shadow-md transition-shadow"
              >
                {editingId === partner.id ? (
                  <div className="space-y-3">
                    <MediaPreview
                      filename={partner.imageFilename}
                      type="image"
                      url={partner.url}
                      size="lg"
                    />
                    <input
                      type="url"
                      value={editingUrl}
                      onChange={(e) => setEditingUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdate(partner.id)}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
                      >
                        <Check className="h-4 w-4" />
                        保存
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-400 transition-colors"
                      >
                        <X className="h-4 w-4" />
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <MediaPreview
                      filename={partner.imageFilename}
                      type="image"
                      url={partner.url}
                      size="lg"
                    />
                    <div className="min-h-12">
                      <p className="text-xs text-gray-600 break-all">
                        {partner.websiteUrl ? (
                          <a
                            href={partner.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {partner.websiteUrl}
                          </a>
                        ) : (
                          <span className="text-gray-400">无官网地址</span>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingId(partner.id);
                          setEditingUrl(partner.websiteUrl || "");
                        }}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-100 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-200 transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(partner.id)}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
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
