"use client";

import { useState, useEffect } from "react";

interface Partner {
  id: string;
  imageFilename: string;
  websiteUrl: string | null;
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
      <div className="rounded-lg border border-gray-200 p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">添加合作伙伴</h3>
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              合作伙伴标志（必传，最大 3MB）
            </label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              accept="image/*"
              className="mt-1 block w-full"
              required
            />
            {file && (
              <p className="mt-2 text-sm text-gray-500">
                选择文件: {file.name} ({(file.size / 1024 / 1024).toFixed(2)}MB)
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">官网地址（可选）</label>
            <input
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://example.com"
              className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 border"
            />
          </div>

          <button
            type="submit"
            disabled={!file || uploading}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {uploading ? "添加中..." : "添加"}
          </button>
        </form>
      </div>

      {/* 合作伙伴列表 */}
      <div className="rounded-lg border border-gray-200 p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">合作伙伴列表</h3>
        <div className="space-y-2">
          {partners.length === 0 ? (
            <p className="text-gray-500">暂无合作伙伴</p>
          ) : (
            partners.map((partner) => (
              <div key={partner.id} className="rounded-lg bg-gray-50 p-4">
                {editingId === partner.id ? (
                  <div className="space-y-2">
                    <input
                      type="url"
                      value={editingUrl}
                      onChange={(e) => setEditingUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 border"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdate(partner.id)}
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
                      <p className="font-medium text-gray-900">{partner.imageFilename}</p>
                      <p className="text-sm text-gray-500">
                        {partner.websiteUrl || "无官网地址"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingId(partner.id);
                          setEditingUrl(partner.websiteUrl || "");
                        }}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(partner.id)}
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
