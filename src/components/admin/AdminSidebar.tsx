"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
  }, [pathname]);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        setIsAuthenticated(false);
        setIsOpen(false);
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

  const navItems = [
    { href: "/admin", label: "仪表板", icon: "📊", desc: "系统概览和统计" },
    { href: "/admin/users", label: "用户管理", icon: "👥", desc: "管理系统用户" },
    { href: "/admin/news", label: "新闻管理", icon: "📰", desc: "管理新闻内容" },
  ];

  if (isCheckingAuth || !isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Mobile Menu Button - Left side of top nav */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden flex items-center justify-center w-10 h-10 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        aria-label="Toggle menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Sidebar Overlay (Mobile) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-16 h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white w-64 transform transition-transform duration-300 z-40 md:relative md:top-0 md:translate-x-0 md:shadow-lg ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Navigation Items */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-start gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                  }`}
                >
                  <span className="text-2xl mt-0.5">{item.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{item.label}</div>
                    <div className={`text-xs ${isActive ? "text-blue-100" : "text-slate-500"}`}>
                      {item.desc}
                    </div>
                  </div>
                  {isActive && (
                    <div className="w-1 h-6 bg-white rounded-full mt-1"></div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer - Logout Button */}
          <div className="p-4 border-t border-slate-700">
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-red-600/20 text-red-300 hover:bg-red-600/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="text-sm font-medium">
                {isLoggingOut ? "登出中..." : "登出"}
              </span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
