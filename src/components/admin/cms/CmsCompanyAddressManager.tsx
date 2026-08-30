"use client";

import { useState, useEffect } from "react";
import { Trash2, Edit2, Check, X } from "lucide-react";

interface CompanyAddress {
  id: string;
  language: string;
  address: string;
}

export default function CmsCompanyAddressManager() {
  const [addresses, setAddresses] = useState<CompanyAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingAddress, setEditingAddress] = useState("");
  const [newLanguage, setNewLanguage] = useState("en");
  const [newAddress, setNewAddress] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const res = await fetch("/api/admin/cms/company-addresses");
      const data = await res.json();
      if (data.success || Array.isArray(data.data)) {
        setAddresses(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch addresses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddress) {
      alert("请输入公司地址");
      return;
    }

    // 检查是否已存在该语言的地址
    if (addresses.some((a) => a.language === newLanguage)) {
      alert(`${newLanguage === "zh" ? "中文" : "英文"}地址已存在`);
      return;
    }

    setAdding(true);
    try {
      const res = await fetch("/api/admin/cms/company-addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: newLanguage,
          address: newAddress,
        }),
      });

      if (res.ok) {
        alert("添加成功");
        setNewAddress("");
        await fetchAddresses();
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
    const address = addresses.find((a) => a.id === id);
    if (!address) return;

    try {
      const res = await fetch(`/api/admin/cms/company-addresses?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: address.language,
          address: editingAddress,
        }),
      });

      if (res.ok) {
        alert("更新成功");
        setEditingId(null);
        await fetchAddresses();
      } else {
        alert("更新失败");
      }
    } catch (error) {
      alert(`错误: ${error}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个公司地址吗？")) return;

    try {
      const res = await fetch(`/api/admin/cms/company-addresses?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("删除成功");
        await fetchAddresses();
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

  const zhAddress = addresses.find((a) => a.language === "zh");
  const enAddress = addresses.find((a) => a.language === "en");
  const missingLanguages = ["zh", "en"].filter(
    (lang) => !addresses.find((a) => a.language === lang)
  );

  return (
    <div className="space-y-8">
      {/* 添加表单 - 仅当缺少地址时显示 */}
      {missingLanguages.length > 0 && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">添加公司地址</h3>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">语言</label>
              <select
                value={newLanguage}
                onChange={(e) => setNewLanguage(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {missingLanguages.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang === "zh" ? "中文" : "英文"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">公司地址</label>
              <textarea
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                placeholder="请输入完整的公司地址"
                rows={3}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={!newAddress || adding}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {adding ? "添加中..." : "添加地址"}
            </button>
          </form>
        </div>
      )}

      {/* 中文地址 */}
      <div className="rounded-lg border border-gray-200 p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">🇨🇳 中文地址</h3>
        {zhAddress ? (
          <div>
            {editingId === zhAddress.id ? (
              <div className="space-y-3">
                <textarea
                  value={editingAddress}
                  onChange={(e) => setEditingAddress(e.target.value)}
                  rows={3}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdate(zhAddress.id)}
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
                  <button
                    onClick={() => handleDelete(zhAddress.id)}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    删除
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="whitespace-pre-wrap text-gray-700 p-3 bg-gray-50 rounded-lg">{zhAddress.address}</p>
                <button
                  onClick={() => {
                    setEditingId(zhAddress.id);
                    setEditingAddress(zhAddress.address);
                  }}
                  className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-100 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-200 transition-colors"
                >
                  <Edit2 className="h-4 w-4" />
                  编辑
                </button>
              </div>
            )}
          </div>
        ) : (
          <p className="text-center py-4 text-gray-500">暂无中文地址</p>
        )}
      </div>

      {/* 英文地址 */}
      <div className="rounded-lg border border-gray-200 p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">🇬🇧 英文地址</h3>
        {enAddress ? (
          <div>
            {editingId === enAddress.id ? (
              <div className="space-y-3">
                <textarea
                  value={editingAddress}
                  onChange={(e) => setEditingAddress(e.target.value)}
                  rows={3}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdate(enAddress.id)}
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
                  <button
                    onClick={() => handleDelete(enAddress.id)}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    删除
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="whitespace-pre-wrap text-gray-700 p-3 bg-gray-50 rounded-lg">{enAddress.address}</p>
                <button
                  onClick={() => {
                    setEditingId(enAddress.id);
                    setEditingAddress(enAddress.address);
                  }}
                  className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-100 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-200 transition-colors"
                >
                  <Edit2 className="h-4 w-4" />
                  编辑
                </button>
              </div>
            )}
          </div>
        ) : (
          <p className="text-center py-4 text-gray-500">暂无英文地址</p>
        )}
      </div>
    </div>
  );
}
