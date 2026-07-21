"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLoginForm from "@/components/admin/AdminLoginForm";

export default function AdminLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const checkSession = async () => {
      try {
        const url = new URL("/api/admin/session", window.location.origin);
        const response = await fetch(url.toString());
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const result = (await response.json()) as { success: boolean; data: { authenticated: boolean } };
        const authenticated = result.data?.authenticated ?? false;
        if (authenticated) {
          router.replace("/admin/news");
        } else {
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Session check error:", err);
        setError(err instanceof Error ? err.message : "检查会话失败");
        setIsLoading(false);
      }
    };
    checkSession();
  }, [router]);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-12">
        <div className="text-slate-600">加载中...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm rounded-lg border border-red-200 bg-red-50 p-6">
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 w-full rounded-md bg-red-600 px-4 py-2 text-white text-sm"
          >
            重试
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <AdminLoginForm />
    </main>
  );
}
