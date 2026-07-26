"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AdminSidebar from "./AdminSidebar";

export default function AdminNavigation() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/session");
        if (response.ok) {
          const data = (await response.json()) as { success: boolean; data?: { authenticated: boolean } };
          setIsAuthenticated(data.data?.authenticated ?? false);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setIsAuthenticated(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    checkAuth();
  }, []);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        setIsAuthenticated(false);
        router.replace("/admin/login");
        router.refresh();
      } else {
        setIsLoggingOut(false);
      }
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoggingOut(false);
    }
  }

  if (isCheckingAuth || !isAuthenticated) {
    return null;
  }

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Mobile: Menu Button */}
            <AdminSidebar />

            {/* Logo */}
            <Link href="/admin" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:shadow-lg transition-shadow">
                H
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-bold text-slate-900">汉理新能源</div>
                <div className="text-xs text-slate-500">管理系统</div>
              </div>
            </Link>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-medium hover:shadow-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:inline">{isLoggingOut ? "登出中..." : "登出"}</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
