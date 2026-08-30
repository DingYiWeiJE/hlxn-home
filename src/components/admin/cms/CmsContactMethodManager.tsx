"use client";

import { useState, useEffect } from "react";

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
      <div className="rounded-lg border border-gray-200 p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">添加联系方式</h3>
        <form onSubmit={handleAdd} className="space-y-4">
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
              标题（如"电话"、"邮箱"）
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：电话、邮箱、微信"
              className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 border"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">联系信息</label>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="例如：0755-12345678、contact@example.com"
              className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 border"
            />
          </div>

          <button
            type="submit"
            disabled={!title || !value || adding}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {adding ? "添加中..." : "添加"}
          </button>
        </form>
      </div>

      {/* 中文联系方式 */}
      <div className="rounded-lg border border-gray-200 p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">中文联系方式</h3>
        <div className="space-y-2">
          {zhMethods.length === 0 ? (
            <p className="text-gray-500">暂无中文联系方式</p>
          ) : (
            zhMethods.map((method) => (
              <div key={method.id} className="rounded-lg bg-gray-50 p-4">
                {editingId === method.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editingData.title || ""}
                      onChange={(e) =>
                        setEditingData({ ...editingData, title: e.target.value })
                      }
                      className="block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 border mb-2"
                    />
                    <input
                      type="text"
                      value={editingData.value || ""}
                      onChange={(e) =>
                        setEditingData({ ...editingData, value: e.target.value })
                      }
                      className="block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 border"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdate(method.id)}
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
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(method.id)}
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

      {/* 英文联系方式 */}
      <div className="rounded-lg border border-gray-200 p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">英文联系方式</h3>
        <div className="space-y-2">
          {enMethods.length === 0 ? (
            <p className="text-gray-500">暂无英文联系方式</p>
          ) : (
            enMethods.map((method) => (
              <div key={method.id} className="rounded-lg bg-gray-50 p-4">
                {editingId === method.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editingData.title || ""}
                      onChange={(e) =>
                        setEditingData({ ...editingData, title: e.target.value })
                      }
                      className="block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 border mb-2"
                    />
                    <input
                      type="text"
                      value={editingData.value || ""}
                      onChange={(e) =>
                        setEditingData({ ...editingData, value: e.target.value })
                      }
                      className="block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 border"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdate(method.id)}
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
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(method.id)}
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
