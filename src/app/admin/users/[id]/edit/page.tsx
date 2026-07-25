"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

type User = {
  id: string;
  username: string;
  email: string | null;
  role: "SUPER_ADMIN" | "ADMIN" | "EDITOR" | "VIEWER";
  isActive: boolean;
};

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [resetPasswordInput, setResetPasswordInput] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    role: "ADMIN" as "SUPER_ADMIN" | "ADMIN" | "EDITOR" | "VIEWER",
    isActive: true,
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await fetch(`/api/admin/users/${userId}`);
        if (!response.ok) {
          if (response.status === 401) {
            router.replace("/admin/login");
            return;
          }
          throw new Error(`HTTP ${response.status}`);
        }

        const data = (await response.json()) as { success: boolean; data: User };
        const userData = data.data;
        setUser(userData);
        setFormData({
          email: userData.email || "",
          role: userData.role,
          isActive: userData.isActive,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载用户失败");
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, [userId, router]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = (await response.json()) as { success: boolean; error?: { message: string } };

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || "更新失败");
      }

      router.push("/admin/users");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新用户失败");
    } finally {
      setSaving(false);
    }
  }

  async function onResetPassword() {
    if (!resetPasswordInput) return;

    setSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: resetPasswordInput }),
      });

      const data = (await response.json()) as { success: boolean; error?: { message: string } };

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || "重置失败");
      }

      setShowResetPassword(false);
      setResetPasswordInput("");
      alert("密码重置成功");
    } catch (err) {
      setError(err instanceof Error ? err.message : "重置密码失败");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!confirm("确定要删除此用户吗？此操作无法撤销。")) return;

    setSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      const data = (await response.json()) as { success: boolean; error?: { message: string } };

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || "删除失败");
      }

      router.push("/admin/users");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除用户失败");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="text-center text-slate-600">加载中...</div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="text-center text-red-600">用户不存在</div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link href="/admin/users" className="text-blue-600 hover:text-blue-700">
          ← 返回用户列表
        </Link>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="mb-6 text-2xl font-semibold">编辑用户: {user.username}</h1>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              用户名
              <input
                type="text"
                value={user.username}
                disabled
                className="mt-2 w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-slate-500"
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
                disabled={saving}
                required
              />
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              角色 <span className="text-red-500">*</span>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                disabled={saving}
              >
                <option value="SUPER_ADMIN">超级管理员</option>
                <option value="ADMIN">管理员</option>
                <option value="EDITOR">编辑</option>
                <option value="VIEWER">浏览者</option>
              </select>
            </label>
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                disabled={saving}
                className="rounded border-slate-300"
              />
              <span className="text-sm font-medium text-slate-700">账户激活</span>
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {saving ? "保存中..." : "保存更改"}
            </button>
            <button
              type="button"
              onClick={() => setShowResetPassword(!showResetPassword)}
              disabled={saving}
              className="rounded-md border border-orange-300 px-6 py-2 font-medium text-orange-600 hover:bg-orange-50 disabled:cursor-not-allowed"
            >
              重置密码
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={saving}
              className="rounded-md border border-red-300 px-6 py-2 font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed"
            >
              删除用户
            </button>
            <Link href="/admin/users" className="rounded-md border border-slate-300 px-6 py-2 font-medium text-slate-700 hover:bg-slate-50">
              取消
            </Link>
          </div>
        </form>

        {showResetPassword && (
          <div className="mt-6 border-t border-slate-200 pt-6">
            <h3 className="mb-4 font-medium">重置密码</h3>
            <div className="space-y-3">
              <input
                type="password"
                placeholder="新密码（最少 8 个字符）"
                value={resetPasswordInput}
                onChange={(e) => setResetPasswordInput(e.target.value)}
                disabled={saving}
                minLength={8}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
              <div className="flex gap-2">
                <button
                  onClick={onResetPassword}
                  disabled={!resetPasswordInput || saving}
                  className="rounded-md bg-orange-600 px-4 py-2 font-medium text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  确认重置
                </button>
                <button
                  onClick={() => {
                    setShowResetPassword(false);
                    setResetPasswordInput("");
                  }}
                  disabled={saving}
                  className="rounded-md border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
