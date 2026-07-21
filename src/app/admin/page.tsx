"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminIndex() {
  const router = useRouter();
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
        router.replace(authenticated ? "/admin/news" : "/admin/login");
      } catch (error) {
        console.error("Session check failed:", error);
        setError(`错误: ${error instanceof Error ? error.message : "未知错误"}`);
      }
    };
    checkSession();
  }, [router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-lg bg-red-50 p-6 text-red-700">{error}</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-slate-600">加载中...</div>
    </div>
  );
}
