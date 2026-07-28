"use client";

import {
  Check,
  ChevronDown,
  Edit3,
  FolderTree,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type CategoryLevel = "LEVEL_ONE" | "LEVEL_TWO";

type CategoryItem = {
  id: string;
  name: string;
  slug: string;
  level: CategoryLevel;
  parentId: string | null;
  parent: {
    id: string;
    name: string;
    slug: string;
  } | null;
  sortOrder: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  counts: {
    children: number;
    products: number;
  };
};

type ApiFailure = {
  success: false;
  error: {
    code: string;
    message: string;
    fieldErrors: Record<string, string[]>;
  };
};

type CategoryListResponse =
  | {
      success: true;
      data: {
        items: CategoryItem[];
      };
    }
  | ApiFailure;

type CategoryMutationResponse =
  | {
      success: true;
      data: CategoryItem;
    }
  | ApiFailure;

type CategoryFormState = {
  name: string;
  level: CategoryLevel;
  parentId: string;
  sortOrder: string;
  enabled: boolean;
};

const emptyForm: CategoryFormState = {
  name: "",
  level: "LEVEL_ONE",
  parentId: "",
  sortOrder: "0",
  enabled: true,
};

function getErrorMessage(
  result: CategoryListResponse | CategoryMutationResponse,
): string {
  if (!result.success) {
    const firstFieldError = Object.values(
      result.error.fieldErrors,
    ).flat()[0];

    return firstFieldError || result.error.message;
  }

  return "请求失败，请稍后重试";
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [keyword, setKeyword] = useState("");
  const [selectedPrimaryId, setSelectedPrimaryId] = useState("");
  const [activeLevel, setActiveLevel] = useState<
    "ALL" | CategoryLevel
  >("ALL");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [pageError, setPageError] = useState("");
  const [formError, setFormError] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<CategoryItem | null>(null);
  const [form, setForm] = useState<CategoryFormState>(emptyForm);

  const loadCategories = useCallback(async () => {
    setIsLoading(true);
    setPageError("");

    try {
      const response = await fetch("/api/admin/categories", {
        cache: "no-store",
      });

      const result = (await response.json()) as CategoryListResponse;

      if (!response.ok || !result.success) {
        throw new Error(getErrorMessage(result));
      }

      setCategories(result.data.items);
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "产品分类加载失败",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const primaryCategories = useMemo(
    () =>
      categories
        .filter((item) => item.level === "LEVEL_ONE")
        .sort(
          (a, b) =>
            a.sortOrder - b.sortOrder ||
            a.name.localeCompare(b.name),
        ),
    [categories],
  );

  const secondaryCategories = useMemo(
    () =>
      categories
        .filter((item) => item.level === "LEVEL_TWO")
        .sort(
          (a, b) =>
            a.sortOrder - b.sortOrder ||
            a.name.localeCompare(b.name),
        ),
    [categories],
  );

  const filteredCategories = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return categories
      .filter((item) => {
        if (activeLevel !== "ALL" && item.level !== activeLevel) {
          return false;
        }

        if (
          selectedPrimaryId &&
          item.level === "LEVEL_TWO" &&
          item.parentId !== selectedPrimaryId
        ) {
          return false;
        }

        if (
          selectedPrimaryId &&
          item.level === "LEVEL_ONE" &&
          item.id !== selectedPrimaryId
        ) {
          return false;
        }

        if (!normalizedKeyword) {
          return true;
        }

        return (
          item.name.toLowerCase().includes(normalizedKeyword) ||
          item.slug.toLowerCase().includes(normalizedKeyword) ||
          item.parent?.name
            .toLowerCase()
            .includes(normalizedKeyword)
        );
      })
      .sort((a, b) => {
        if (a.level !== b.level) {
          return a.level === "LEVEL_ONE" ? -1 : 1;
        }

        return (
          a.sortOrder - b.sortOrder ||
          a.name.localeCompare(b.name)
        );
      });
  }, [
    activeLevel,
    categories,
    keyword,
    selectedPrimaryId,
  ]);

  function openCreateForm(level: CategoryLevel = "LEVEL_ONE") {
    setEditingCategory(null);
    setFormError("");
    setForm({
      ...emptyForm,
      level,
      parentId:
        level === "LEVEL_TWO" ? selectedPrimaryId : "",
    });
    setIsFormOpen(true);
  }

  function openEditForm(category: CategoryItem) {
    setEditingCategory(category);
    setFormError("");
    setForm({
      name: category.name,
      level: category.level,
      parentId: category.parentId ?? "",
      sortOrder: String(category.sortOrder),
      enabled: category.enabled,
    });
    setIsFormOpen(true);
  }

  function closeForm(force = false) {
    if (isSubmitting && !force) {
      return;
    }

    setIsFormOpen(false);
    setEditingCategory(null);
    setFormError("");
    setForm(emptyForm);
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setFormError("");
    setIsSubmitting(true);

    try {
      const payload = {
        name: form.name.trim(),

        parentId:
          form.level === "LEVEL_TWO"
            ? form.parentId || null
            : null,
        sortOrder: Number(form.sortOrder || 0),
        enabled: form.enabled,
        ...(editingCategory
          ? {}
          : {
              level: form.level,
            }),
      };

      const endpoint = editingCategory
        ? `/api/admin/categories/${editingCategory.id}`
        : "/api/admin/categories";

      const response = await fetch(endpoint, {
        method: editingCategory ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result =
        (await response.json()) as CategoryMutationResponse;

      if (!response.ok || !result.success) {
        throw new Error(getErrorMessage(result));
      }

      closeForm(true);
      await loadCategories();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "分类保存失败",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(category: CategoryItem) {
    const confirmed = window.confirm(
      `确认删除分类“${category.name}”吗？\n\n有关联子分类或产品时，系统会阻止删除。`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(category.id);
    setPageError("");

    try {
      const response = await fetch(
        `/api/admin/categories/${category.id}`,
        {
          method: "DELETE",
        },
      );

      const result =
        (await response.json()) as CategoryMutationResponse;

      if (!response.ok || !result.success) {
        throw new Error(getErrorMessage(result));
      }

      await loadCategories();
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "分类删除失败",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] px-5 py-8 sm:px-8 lg:px-10">
      <header className="flex flex-col gap-5 border-b border-slate-200 pb-7 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-blue-600">
            <FolderTree className="h-4 w-4" />
            产品内容管理
          </div>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
            产品分类
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            管理产品的一级分类和二级分类。产品最终关联二级分类，
            一级分类用于组织和筛选。
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void loadCategories()}
            disabled={isLoading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              className={[
                "h-4 w-4",
                isLoading ? "animate-spin" : "",
              ].join(" ")}
            />
            刷新
          </button>

          <button
            type="button"
            onClick={() => openCreateForm("LEVEL_TWO")}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
          >
            <Plus className="h-4 w-4" />
            新增二级分类
          </button>

          <button
            type="button"
            onClick={() => openCreateForm("LEVEL_ONE")}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            新增一级分类
          </button>
        </div>
      </header>

      <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="分类总数"
          value={categories.length}
          description="包含一级和二级分类"
        />
        <StatCard
          label="一级分类"
          value={primaryCategories.length}
          description="产品目录的顶层分类"
        />
        <StatCard
          label="二级分类"
          value={secondaryCategories.length}
          description="产品实际关联的分类"
        />
        <StatCard
          label="已停用分类"
          value={
            categories.filter((item) => !item.enabled).length
          }
          description="前台不会展示"
        />
      </section>

      <section className="mt-7 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            {[
              { value: "ALL", label: "全部分类" },
              {
                value: "LEVEL_ONE",
                label: "一级分类",
              },
              {
                value: "LEVEL_TWO",
                label: "二级分类",
              },
            ].map((item) => {
              const active = activeLevel === item.value;

              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() =>
                    setActiveLevel(
                      item.value as
                        | "ALL"
                        | CategoryLevel,
                    )
                  }
                  className={[
                    "rounded-lg px-4 py-2 text-sm font-semibold transition",
                    active
                      ? "bg-slate-950 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                  ].join(" ")}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                value={keyword}
                onChange={(event) =>
                  setKeyword(event.target.value)
                }
                placeholder="搜索分类名称或 Slug"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:w-64"
              />
            </label>

            <label className="relative block">
              <select
                value={selectedPrimaryId}
                onChange={(event) =>
                  setSelectedPrimaryId(event.target.value)
                }
                className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:w-56"
              >
                <option value="">全部一级分类</option>

                {primaryCategories.map((category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                  </option>
                ))}
              </select>

              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </label>
          </div>
        </div>

        {pageError ? (
          <div className="m-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {pageError}
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex min-h-80 items-center justify-center">
            <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              正在加载产品分类
            </div>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="flex min-h-80 flex-col items-center justify-center px-5 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <FolderTree className="h-7 w-7" />
            </div>

            <h2 className="mt-4 text-base font-semibold text-slate-800">
              暂无符合条件的分类
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              可以调整筛选条件或创建新的产品分类。
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-4">分类</th>
                  <th className="px-5 py-4">层级</th>
                  <th className="px-5 py-4">所属一级分类</th>
                  <th className="px-5 py-4">关联内容</th>
                  <th className="px-5 py-4">排序</th>
                  <th className="px-5 py-4">状态</th>
                  <th className="px-5 py-4 text-right">操作</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredCategories.map((category) => (
                  <tr
                    key={category.id}
                    className="transition hover:bg-slate-50/80"
                  >
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900">
                        {category.name}
                      </div>

                      <div className="mt-1 font-mono text-xs text-slate-400">
                        {category.slug}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={[
                          "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                          category.level === "LEVEL_ONE"
                            ? "bg-violet-50 text-violet-700"
                            : "bg-blue-50 text-blue-700",
                        ].join(" ")}
                      >
                        {category.level === "LEVEL_ONE"
                          ? "一级分类"
                          : "二级分类"}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {category.parent?.name ?? "—"}
                    </td>

                    <td className="px-5 py-4">
                      <div className="text-sm text-slate-700">
                        {category.level === "LEVEL_ONE"
                          ? `${category.counts.children} 个二级分类`
                          : `${category.counts.products} 个产品`}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm tabular-nums text-slate-600">
                      {category.sortOrder}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={[
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                          category.enabled
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500",
                        ].join(" ")}
                      >
                        <span
                          className={[
                            "h-1.5 w-1.5 rounded-full",
                            category.enabled
                              ? "bg-emerald-500"
                              : "bg-slate-400",
                          ].join(" ")}
                        />

                        {category.enabled ? "启用" : "停用"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            openEditForm(category)
                          }
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                          aria-label={`编辑 ${category.name}`}
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void handleDelete(category)
                          }
                          disabled={deletingId === category.id}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                          aria-label={`删除 ${category.name}`}
                        >
                          {deletingId === category.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {isFormOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <button
            type="button"
            aria-label="关闭分类表单"
            className="absolute inset-0"
            onClick={() => closeForm()}
          />

          <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-white/20 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
                  Product Category
                </p>

                <h2 className="mt-2 text-xl font-bold text-slate-950">
                  {editingCategory
                    ? "编辑产品分类"
                    : "创建产品分类"}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => closeForm()}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="关闭"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-5 px-6 py-6">
                {formError ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {formError}
                  </div>
                ) : null}

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    分类层级
                  </label>

                  <div className="mt-2 grid grid-cols-2 gap-3">
                    {[
                      {
                        value: "LEVEL_ONE",
                        label: "一级分类",
                      },
                      {
                        value: "LEVEL_TWO",
                        label: "二级分类",
                      },
                    ].map((item) => {
                      const selected =
                        form.level === item.value;

                      return (
                        <button
                          key={item.value}
                          type="button"
                          disabled={Boolean(editingCategory)}
                          onClick={() =>
                            setForm((current) => ({
                              ...current,
                              level:
                                item.value as CategoryLevel,
                              parentId:
                                item.value === "LEVEL_ONE"
                                  ? ""
                                  : current.parentId,
                            }))
                          }
                          className={[
                            "flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition",
                            selected
                              ? "border-blue-600 bg-blue-50 text-blue-700"
                              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                            editingCategory
                              ? "cursor-not-allowed opacity-60"
                              : "",
                          ].join(" ")}
                        >
                          {selected ? (
                            <Check className="h-4 w-4" />
                          ) : null}

                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {form.level === "LEVEL_TWO" ? (
                  <div>
                    <label
                      htmlFor="parentId"
                      className="text-sm font-semibold text-slate-700"
                    >
                      所属一级分类
                    </label>

                    <div className="relative mt-2">
                      <select
                        id="parentId"
                        value={form.parentId}
                        required
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            parentId: event.target.value,
                          }))
                        }
                        className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      >
                        <option value="">请选择一级分类</option>

                        {primaryCategories.map((category) => (
                          <option
                            key={category.id}
                            value={category.id}
                          >
                            {category.name}
                          </option>
                        ))}
                      </select>

                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>
                ) : null}

                <div>
                  <label
                    htmlFor="categoryName"
                    className="text-sm font-semibold text-slate-700"
                  >
                    分类名称
                  </label>

                  <input
                    id="categoryName"
                    value={form.name}
                    required
                    maxLength={100}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    placeholder="例如：储能产品"
                    className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>


                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="sortOrder"
                      className="text-sm font-semibold text-slate-700"
                    >
                      排序值
                    </label>

                    <input
                      id="sortOrder"
                      type="number"
                      min={0}
                      value={form.sortOrder}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          sortOrder: event.target.value,
                        }))
                      }
                      className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <span className="text-sm font-semibold text-slate-700">
                      分类状态
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          enabled: !current.enabled,
                        }))
                      }
                      className={[
                        "mt-2 flex h-11 w-full items-center justify-between rounded-xl border px-4 text-sm font-semibold transition",
                        form.enabled
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-slate-50 text-slate-500",
                      ].join(" ")}
                    >
                      {form.enabled ? "已启用" : "已停用"}

                      <span
                        className={[
                          "relative h-6 w-11 rounded-full transition",
                          form.enabled
                            ? "bg-emerald-500"
                            : "bg-slate-300",
                        ].join(" ")}
                      >
                        <span
                          className={[
                            "absolute top-1 h-4 w-4 rounded-full bg-white shadow transition",
                            form.enabled
                              ? "left-6"
                              : "left-1",
                          ].join(" ")}
                        />
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
                <button
                  type="button"
                  onClick={() => closeForm()}
                  disabled={isSubmitting}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  取消
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}

                  {editingCategory
                    ? "保存修改"
                    : "创建分类"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StatCard({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>

      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
        {value}
      </p>

      <p className="mt-2 text-xs leading-5 text-slate-400">
        {description}
      </p>
    </div>
  );
}