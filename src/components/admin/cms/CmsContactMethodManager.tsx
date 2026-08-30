"use client";

import { useState, useEffect } from "react";
import { Trash2, Edit2, Check, X } from "lucide-react";

interface ContactMethod {
  id: string;
  language: string;
  title: string;
  value: string;
}

export default function CmsContactMethodManager() {
  const [methods, setMethods] = useState<ContactMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState("zh");
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Partial<ContactMethod>>({});

  useEffect(() => {
    fetchMethods();
  }, []);

  const fetchMethods = async () => {
    try {
      const res = await fetch("/api/admin/cms/contact-methods");
      const data = await res.json();
      if (data.success || Array.isArray(data.data)) {
        setMethods(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch contact methods:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !value) {
      alert("请填写完整的信息");
      return;
    }

    setAdding(true);
    try {
      const res = await fetch("/api/admin/cms/contact-methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: selectedLanguage,
          title,
          value,
        }),
      });

      if (res.ok) {
        alert("添加成功");
        setTitle("");
        setValue("");
        await fetchMethods();
      } else {
        alert("添加失败");
      }
    } catch (error) {
      alert(`错误: ${error}`);
    } finally {
      setAdding(false);
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/cms/contact-methods?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingData),
      });

      if (res.ok) {
        alert("更新成功");
        setEditingId(null);
        await fetchMethods();
      } else {
        alert("更新失败");
      }
    } catch (error) {
      alert(`错误: ${error}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个联系方式吗？")) return;

    try {
      const res = await fetch(`/api/admin/cms/contact-methods?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("删除成功");
        await fetchMethods();
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

  const zhMethods = methods.filter((m) => m.language === "zh");
  const enMethods = methods.filter((m) => m.language === "en");

  return (
    <div className="space-y-8">
      {/* 添加表单 */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">添加联系方式</h3>
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">语言</label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="zh">中文</option>
                <option value="en">英文</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                标题（如"电话"、"邮箱"）
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例如：电话、邮箱、微信"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">联系信息</label>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="例如：0755-12345678、contact@example.com"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={!title || !value || adding}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {adding ? "添加中..." : "添加联系方式"}
          </button>
        </form>
      </div>

      {/* 中文联系方式 */}
      <div className="rounded-lg border border-gray-200 p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">🇨🇳 中文联系方式</h3>
        <div className="space-y-2">
          {zhMethods.length === 0 ? (
            <p className="text-center py-4 text-gray-500">暂无中文联系方式</p>
          ) : (
            zhMethods.map((method) => (
              <div key={method.id} className="rounded-lg border border-gray-200 bg-white p-4">
                {editingId === method.id ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editingData.title || ""}
                      onChange={(e) =>
                        setEditingData({ ...editingData, title: e.target.value })
                      }
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="标题"
                    />
                    <input
                      type="text"
                      value={editingData.value || ""}
                      onChange={(e) =>
                        setEditingData({ ...editingData, value: e.target.value })
                      }
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="联系信息"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdate(method.id)}
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
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{method.title}</p>
                      <p className="text-sm text-gray-500">{method.value}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingId(method.id);
                          setEditingData({
                            title: method.title,
                            value: method.value,
                          });
                        }}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-100 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-200 transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(method.id)}
                        className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors"
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

      {/* 英文联系方式 */}
      <div className="rounded-lg border border-gray-200 p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">🇬🇧 英文联系方式</h3>
        <div className="space-y-2">
          {enMethods.length === 0 ? (
            <p className="text-center py-4 text-gray-500">暂无英文联系方式</p>
          ) : (
            enMethods.map((method) => (
              <div key={method.id} className="rounded-lg border border-gray-200 bg-white p-4">
                {editingId === method.id ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editingData.title || ""}
                      onChange={(e) =>
                        setEditingData({ ...editingData, title: e.target.value })
                      }
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="标题"
                    />
                    <input
                      type="text"
                      value={editingData.value || ""}
                      onChange={(e) =>
                        setEditingData({ ...editingData, value: e.target.value })
                      }
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="联系信息"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdate(method.id)}
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
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{method.title}</p>
                      <p className="text-sm text-gray-500">{method.value}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingId(method.id);
                          setEditingData({
                            title: method.title,
                            value: method.value,
                          });
                        }}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-100 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-200 transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(method.id)}
                        className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors"
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
