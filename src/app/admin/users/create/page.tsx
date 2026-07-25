"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CreateUserPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "ADMIN",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = (await response.json()) as { success: boolean; error?: { message: string } };

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || "创建失败");
      }

      router.push("/admin/users");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建用户失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link href="/admin/users" className="text-blue-600 hover:text-blue-700">
          ← 返回用户列表
        </Link>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="mb-6 text-2xl font-semibold">创建新用户</h1>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              用户名 <span className="text-red-500">*</span>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                disabled={loading}
                required
                minLength={3}
              />
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              邮箱 <span className="text-red-500">*</span>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                disabled={loading}
                required
              />
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              密码 <span className="text-red-500">*</span>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                disabled={loading}
                required
                minLength={8}
              />
            </label>
            <p className="mt-1 text-xs text-slate-500">最少 8 个字符</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              角色 <span className="text-red-500">*</span>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                disabled={loading}
              >
                <option value="SUPER_ADMIN">超级管理员</option>
                <option value="ADMIN">管理员</option>
                <option value="EDITOR">编辑</option>
                <option value="VIEWER">浏览者</option>
              </select>
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {loading ? "创建中..." : "创建用户"}
            </button>
            <Link href="/admin/users" className="rounded-md border border-slate-300 px-6 py-2 font-medium text-slate-700 hover:bg-slate-50">
              取消
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
