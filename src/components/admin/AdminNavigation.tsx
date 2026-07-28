"use client";

import { LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useState,
} from "react";

export default function AdminNavigation() {
  const router = useRouter();

  const [
    isAuthenticated,
    setIsAuthenticated,
  ] = useState(false);

  const [
    isCheckingAuth,
    setIsCheckingAuth,
  ] = useState(true);

  const [
    isLoggingOut,
    setIsLoggingOut,
  ] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      try {
        const response = await fetch(
          "/api/auth/session",
          {
            method: "GET",
            cache: "no-store",
          },
        );

        if (!response.ok) {
          if (!cancelled) {
            setIsAuthenticated(false);
          }

          return;
        }

        const result = (await response.json()) as {
          success: boolean;
          data?: {
            authenticated?: boolean;
          };
        };

        if (!cancelled) {
          setIsAuthenticated(
            result.success &&
              result.data?.authenticated === true,
          );
        }
      } catch (error) {
        console.error(
          "Admin authentication check failed",
          error,
        );

        if (!cancelled) {
          setIsAuthenticated(false);
        }
      } finally {
        if (!cancelled) {
          setIsCheckingAuth(false);
        }
      }
    }

    void checkAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogout() {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      const response = await fetch(
        "/api/auth/logout",
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        throw new Error(
          `Logout failed with status ${response.status}`,
        );
      }

      setIsAuthenticated(false);

      router.replace("/admin/login");
      router.refresh();
    } catch (error) {
      console.error(
        "Admin logout failed",
        error,
      );

      setIsLoggingOut(false);
    }
  }

  if (
    isCheckingAuth ||
    !isAuthenticated
  ) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 h-16 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="flex h-full items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          {/*
           * 移动端需要给 AdminSidebar 的菜单按钮预留空间。
           * AdminSidebar 由 admin/layout.tsx 统一渲染，
           * 这里不能再次渲染，否则会出现重复侧边栏。
           */}
          <div
            className="h-11 w-11 md:hidden"
            aria-hidden="true"
          />

          <Link
            href="/admin"
            className="group flex items-center gap-3"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-lg font-bold text-white shadow-md transition group-hover:shadow-lg">
              H
            </span>

            <span className="hidden sm:block">
              <span className="block text-sm font-bold text-slate-900">
                汉理新能源
              </span>

              <span className="block text-xs text-slate-500">
                管理系统
              </span>
            </span>
          </Link>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
        >
          <LogOut
            className="h-4 w-4"
            aria-hidden="true"
          />

          <span className="hidden sm:inline">
            {isLoggingOut
              ? "正在退出..."
              : "退出登录"}
          </span>
        </button>
      </div>
    </header>
  );
}