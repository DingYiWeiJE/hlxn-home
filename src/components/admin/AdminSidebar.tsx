"use client";

import {
  FolderTree,
  History,
  Images,
  LayoutDashboard,
  LogOut,
  MapPinned,
  Menu,
  MessageSquare,
  Newspaper,
  Package,
  Puzzle,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import {
  usePathname,
  useRouter,
} from "next/navigation";
import {
  useEffect,
  useState,
} from "react";

type NavigationItem = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

const navigationItems: NavigationItem[] = [
  {
    href: "/admin",
    label: "仪表板",
    description: "系统概览和统计",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/contact-submissions",
    label: "客户线索",
    description: "管理联系表单提交",
    icon: MessageSquare,
  },
  {
    href: "/admin/categories",
    label: "产品分类",
    description: "管理一级和二级分类",
    icon: FolderTree,
  },
  {
    href: "/admin/products",
    label: "产品管理",
    description: "创建和维护产品内容",
    icon: Package,
  },
  {
    href: "/admin/solutions",
    label: "解决方案管理",
    description: "创建和维护解决方案内容",
    icon: Puzzle,
  },
  {
    href: "/admin/application-cases",
    label: "应用案例",
    description: "管理应用案例内容",
    icon: Package,
  },
  {
    href: "/admin/company-history",
    label: "公司发展历程",
    description: "管理 About 页面时间轴内容",
    icon: History,
  },
  {
    href: "/admin/strategic-locations",
    label: "战略布局管理",
    description: "管理全球战略网点和中英文展示内容",
    icon: MapPinned,
  },
  // {
  //   href: "/admin/assets",
  //   label: "素材库",
  //   description: "管理产品图片和 PDF",
  //   icon: Images,
  // },
  {
    href: "/admin/news",
    label: "新闻管理",
    description: "管理新闻内容",
    icon: Newspaper,
  },
  {
    href: "/admin/users",
    label: "用户管理",
    description: "管理系统用户",
    icon: Users,
  },
];

function isNavigationItemActive(
  pathname: string,
  href: string,
): boolean {
  if (href === "/admin") {
    return pathname === "/admin";
  }

  return (
    pathname === href ||
    pathname.startsWith(`${href}/`)
  );
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [isOpen, setIsOpen] =
    useState(false);

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
              result.data?.authenticated ===
                true,
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
  }, [pathname]);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [isOpen]);

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
      setIsOpen(false);

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
    <>
      <button
        type="button"
        onClick={() => {
          setIsOpen((current) => !current);
        }}
        className="fixed right-4 top-4 z-[60] inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-lg transition hover:bg-slate-50 md:hidden"
        aria-label={
          isOpen
            ? "关闭后台导航菜单"
            : "打开后台导航菜单"
        }
        aria-expanded={isOpen}
        aria-controls="admin-sidebar"
      >
        {isOpen ? (
          <X
            className="h-5 w-5"
            aria-hidden="true"
          />
        ) : (
          <Menu
            className="h-5 w-5"
            aria-hidden="true"
          />
        )}
      </button>

      {isOpen ? (
        <button
          type="button"
          aria-label="关闭后台导航菜单"
          onClick={() => {
            setIsOpen(false);
          }}
          className="fixed inset-x-0 bottom-0 top-16 z-40 bg-slate-950/50 backdrop-blur-sm md:hidden"
        />
      ) : null}

      <aside
        id="admin-sidebar"
        className={[
          "fixed bottom-0 left-0 top-0 z-50 flex w-72 flex-col border-r border-slate-800 bg-slate-950 text-white shadow-2xl transition-transform duration-300",
          "md:sticky md:top-0 md:z-20 md:h-[calc(100vh)] md:w-72 md:shrink-0 md:translate-x-0 md:shadow-none",
          isOpen
            ? "translate-x-0"
            : "-translate-x-full",
        ].join(" ")}
      >
        <div className="border-b border-slate-800 px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
            Management
          </p>

          <h2 className="mt-2 text-lg font-semibold text-white">
            内容管理中心
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-400">
            管理产品、分类、素材和新闻内容
          </p>
        </div>

        <nav
          className="flex-1 space-y-1 overflow-y-auto px-4 py-5 scrollbar-transparent"
          aria-label="后台管理导航"
        >
          {navigationItems.map((item) => {
            const active =
              isNavigationItemActive(
                pathname,
                item.href,
              );

            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  setIsOpen(false);
                }}
                aria-current={
                  active ? "page" : undefined
                }
                className={[
                  "group relative flex items-center gap-3 rounded-xl px-4 py-3 transition",
                  active
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-950/30"
                    : "text-slate-300 hover:bg-slate-900 hover:text-white",
                ].join(" ")}
              >
                <span
                  className={[
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition",
                    active
                      ? "bg-white/15 text-white"
                      : "bg-slate-900 text-slate-400 group-hover:bg-slate-800 group-hover:text-white",
                  ].join(" ")}
                >
                  <Icon
                    className="h-5 w-5"
                    aria-hidden="true"
                  />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">
                    {item.label}
                  </span>

                  <span
                    className={[
                      "mt-0.5 block truncate text-xs",
                      active
                        ? "text-blue-100"
                        : "text-slate-500 group-hover:text-slate-400",
                    ].join(" ")}
                  >
                    {item.description}
                  </span>
                </span>

                {active ? (
                  <span
                    className="absolute bottom-3 right-0 top-3 w-1 rounded-l-full bg-white"
                    aria-hidden="true"
                  />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-800 p-4">
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex w-full items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300 transition hover:border-red-500/30 hover:bg-red-500/15 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10">
              <LogOut
                className="h-5 w-5"
                aria-hidden="true"
              />
            </span>

            <span>
              {isLoggingOut
                ? "正在退出..."
                : "退出登录"}
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
