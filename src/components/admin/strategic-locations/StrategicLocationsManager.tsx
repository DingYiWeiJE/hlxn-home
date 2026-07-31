"use client";

import {
  AlertCircle,
  Edit3,
  Loader2,
  MapPinned,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import {
  type FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

type LocationType = "HEADQUARTERS" | "BRANCH" | "MARKETING" | "SERVICE";
type LocationStatus = "DRAFT" | "PUBLISHED";
type FieldErrors = Record<string, string[]>;

type StrategicLocationItem = {
  id: string;
  code: string;
  nameZh: string;
  nameEn: string;
  type: LocationType;
  countryCode: string;
  countryNameZh: string;
  countryNameEn: string;
  provinceNameZh: string | null;
  provinceNameEn: string | null;
  cityNameZh: string | null;
  cityNameEn: string | null;
  longitude: number;
  latitude: number;
  establishment: string | null;
  staff: number | null;
  descriptionZh: string | null;
  descriptionEn: string | null;
  businessScopeZh: string[];
  businessScopeEn: string[];
  imageUrl: string | null;
  status: LocationStatus;
  enabled: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

type ListResponse =
  | {
      success: true;
      data: {
        items: StrategicLocationItem[];
        pagination: Pagination;
      };
    }
  | ApiFailure;

type ItemResponse =
  | {
      success: true;
      data: StrategicLocationItem;
    }
  | ApiFailure;

type ApiFailure = {
  success: false;
  error: {
    message: string;
    fieldErrors?: FieldErrors;
  };
};

type FormState = {
  id: string | null;
  code: string;
  nameZh: string;
  nameEn: string;
  type: LocationType;
  countryCode: string;
  countryNameZh: string;
  countryNameEn: string;
  provinceNameZh: string;
  provinceNameEn: string;
  cityNameZh: string;
  cityNameEn: string;
  longitude: string;
  latitude: string;
  establishment: string;
  staff: string;
  descriptionZh: string;
  descriptionEn: string;
  businessScopeZh: string;
  businessScopeEn: string;
  imageUrl: string;
  status: LocationStatus;
  enabled: boolean;
  sortOrder: string;
};

const typeLabels: Record<LocationType, string> = {
  HEADQUARTERS: "总部",
  BRANCH: "分公司",
  MARKETING: "营销分部",
  SERVICE: "服务中心",
};

const statusLabels: Record<LocationStatus, string> = {
  DRAFT: "草稿",
  PUBLISHED: "已发布",
};

const emptyForm: FormState = {
  id: null,
  code: "",
  nameZh: "",
  nameEn: "",
  type: "BRANCH",
  countryCode: "CN",
  countryNameZh: "中国",
  countryNameEn: "China",
  provinceNameZh: "",
  provinceNameEn: "",
  cityNameZh: "",
  cityNameEn: "",
  longitude: "",
  latitude: "",
  establishment: "",
  staff: "",
  descriptionZh: "",
  descriptionEn: "",
  businessScopeZh: "",
  businessScopeEn: "",
  imageUrl: "",
  status: "DRAFT",
  enabled: true,
  sortOrder: "0",
};

function normalizeList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

function linesToArray(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function itemToForm(item: StrategicLocationItem): FormState {
  return {
    id: item.id,
    code: item.code,
    nameZh: item.nameZh,
    nameEn: item.nameEn,
    type: item.type,
    countryCode: item.countryCode,
    countryNameZh: item.countryNameZh,
    countryNameEn: item.countryNameEn,
    provinceNameZh: item.provinceNameZh ?? "",
    provinceNameEn: item.provinceNameEn ?? "",
    cityNameZh: item.cityNameZh ?? "",
    cityNameEn: item.cityNameEn ?? "",
    longitude: String(item.longitude),
    latitude: String(item.latitude),
    establishment: item.establishment ?? "",
    staff: item.staff === null ? "" : String(item.staff),
    descriptionZh: item.descriptionZh ?? "",
    descriptionEn: item.descriptionEn ?? "",
    businessScopeZh: normalizeList(item.businessScopeZh).join("\n"),
    businessScopeEn: normalizeList(item.businessScopeEn).join("\n"),
    imageUrl: item.imageUrl ?? "",
    status: item.status,
    enabled: item.enabled,
    sortOrder: String(item.sortOrder),
  };
}

function getFirstError(errors: FieldErrors, key: string): string | undefined {
  return errors[key]?.[0];
}

function getFailureMessage(result: ApiFailure): string {
  return Object.values(result.error.fieldErrors ?? {}).flat()[0] ?? result.error.message;
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function StrategicLocationsManager() {
  const [items, setItems] = useState<StrategicLocationItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<LocationStatus | "">("");
  const [enabled, setEnabled] = useState<"" | "true" | "false">("");
  const [countryCode, setCountryCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mutatingId, setMutatingId] = useState<string | null>(null);
  const [serverError, setServerError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [form, setForm] = useState<FormState>(emptyForm);

  const isEditing = Boolean(form.id);

  const formTitle = useMemo(
    () => (isEditing ? "编辑战略网点" : "新建战略网点"),
    [isEditing],
  );

  const loadItems = useCallback(
    async (page = 1) => {
      setLoading(true);
      setServerError("");

      try {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: "20",
          sort: "sortOrder",
          order: "asc",
        });

        if (keyword) {
          params.set("keyword", keyword);
        }
        if (status) {
          params.set("status", status);
        }
        if (enabled) {
          params.set("enabled", enabled);
        }
        if (countryCode.trim()) {
          params.set("countryCode", countryCode.trim());
        }

        const response = await fetch(
          `/api/admin/strategic-locations?${params.toString()}`,
          {
            cache: "no-store",
            credentials: "include",
          },
        );
        const result = (await response.json()) as ListResponse;

        if (!response.ok || !result.success) {
          throw new Error(result.success ? "加载失败" : getFailureMessage(result));
        }

        setItems(result.data.items);
        setPagination(result.data.pagination);
      } catch (error) {
        setItems([]);
        setServerError(error instanceof Error ? error.message : "加载失败");
      } finally {
        setLoading(false);
      }
    },
    [countryCode, enabled, keyword, status],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadItems(1);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadItems]);

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetForm() {
    setForm(emptyForm);
    setErrors({});
    setSavedMessage("");
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setKeyword(keywordInput.trim());
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setSubmitting(true);
    setErrors({});
    setServerError("");
    setSavedMessage("");

    try {
      const payload = {
        code: form.code.trim(),
        nameZh: form.nameZh.trim(),
        nameEn: form.nameEn.trim(),
        type: form.type,
        countryCode: form.countryCode.trim(),
        countryNameZh: form.countryNameZh.trim(),
        countryNameEn: form.countryNameEn.trim(),
        provinceNameZh: form.provinceNameZh.trim() || null,
        provinceNameEn: form.provinceNameEn.trim() || null,
        cityNameZh: form.cityNameZh.trim() || null,
        cityNameEn: form.cityNameEn.trim() || null,
        longitude: Number(form.longitude),
        latitude: Number(form.latitude),
        establishment: form.establishment.trim() || null,
        staff: form.staff.trim() ? Number(form.staff) : null,
        descriptionZh: form.descriptionZh.trim() || null,
        descriptionEn: form.descriptionEn.trim() || null,
        businessScopeZh: linesToArray(form.businessScopeZh),
        businessScopeEn: linesToArray(form.businessScopeEn),
        imageUrl: form.imageUrl.trim() || null,
        status: form.status,
        enabled: form.enabled,
        sortOrder: Number(form.sortOrder || 0),
      };

      const response = await fetch(
        isEditing
          ? `/api/admin/strategic-locations/${form.id}`
          : "/api/admin/strategic-locations",
        {
          method: isEditing ? "PATCH" : "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );
      const result = (await response.json()) as ItemResponse;

      if (!response.ok || !result.success) {
        if (!result.success) {
          setErrors(result.error.fieldErrors ?? {});
        }
        throw new Error(result.success ? "保存失败" : getFailureMessage(result));
      }

      setForm(itemToForm(result.data));
      setSavedMessage("保存成功");
      await loadItems(pagination.page);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "保存失败");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(item: StrategicLocationItem) {
    const confirmed = window.confirm(
      `确认删除战略网点「${item.nameZh} / ${item.nameEn}」吗？\n\n删除后官网不再展示该网点。`,
    );

    if (!confirmed) {
      return;
    }

    setMutatingId(item.id);
    setServerError("");

    try {
      const response = await fetch(`/api/admin/strategic-locations/${item.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const result = (await response.json()) as
        | { success: true; data: unknown }
        | ApiFailure;

      if (!response.ok || !result.success) {
        throw new Error(result.success ? "删除失败" : getFailureMessage(result));
      }

      if (form.id === item.id) {
        resetForm();
      }

      await loadItems(pagination.page);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "删除失败");
    } finally {
      setMutatingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
            Strategic Locations
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-950">战略布局管理</h1>
          <p className="mt-1 text-sm text-slate-500">
            共 {pagination.total} 个网点；中文站读取中文字段，英文站读取英文字段。
          </p>
        </div>
        <button
          type="button"
          onClick={resetForm}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          新建网点
        </button>
      </header>

      {serverError ? (
        <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {serverError}
        </div>
      ) : null}

      {savedMessage ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {savedMessage}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_440px]">
        <section className="space-y-4">
          <form
            onSubmit={handleSearch}
            className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2 xl:grid-cols-6"
          >
            <label className="relative md:col-span-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={keywordInput}
                onChange={(event) => setKeywordInput(event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                placeholder="搜索编码、名称、国家、省份或城市"
              />
            </label>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as LocationStatus | "")}
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              <option value="">全部状态</option>
              <option value="DRAFT">草稿</option>
              <option value="PUBLISHED">已发布</option>
            </select>
            <select
              value={enabled}
              onChange={(event) => setEnabled(event.target.value as "" | "true" | "false")}
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              <option value="">全部启用状态</option>
              <option value="true">启用</option>
              <option value="false">停用</option>
            </select>
            <input
              value={countryCode}
              onChange={(event) => setCountryCode(event.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm uppercase outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              placeholder="国家代码"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white"
              >
                搜索
              </button>
              <button
                type="button"
                onClick={() => void loadItems(pagination.page)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                aria-label="刷新"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </form>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {loading ? (
              <div className="flex min-h-96 items-center justify-center text-sm text-slate-500">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                正在加载战略网点
              </div>
            ) : items.length === 0 ? (
              <div className="flex min-h-96 flex-col items-center justify-center px-6 text-center text-slate-500">
                <MapPinned className="mb-3 h-10 w-10 text-slate-300" />
                <p className="text-sm">暂无战略网点</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {items.map((item) => (
                  <article key={item.id} className="p-5 hover:bg-slate-50">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-semibold text-slate-950">
                            {item.nameZh}
                          </h2>
                          <span className="text-sm text-slate-500">
                            {item.nameEn}
                          </span>
                          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                            {typeLabels[item.type]}
                          </span>
                          <span
                            className={[
                              "rounded-full px-2.5 py-1 text-xs font-semibold",
                              item.status === "PUBLISHED"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-amber-50 text-amber-700",
                            ].join(" ")}
                          >
                            {statusLabels[item.status]}
                          </span>
                          <span
                            className={[
                              "rounded-full px-2.5 py-1 text-xs font-semibold",
                              item.enabled
                                ? "bg-slate-100 text-slate-700"
                                : "bg-red-50 text-red-700",
                            ].join(" ")}
                          >
                            {item.enabled ? "启用" : "停用"}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-slate-600">
                          {item.countryNameZh}
                          {item.provinceNameZh ? ` / ${item.provinceNameZh}` : ""}
                          {item.cityNameZh ? ` / ${item.cityNameZh}` : ""}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.code} · {item.countryCode} · {item.longitude}, {item.latitude} · 排序 {item.sortOrder}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          更新于 {formatDateTime(item.updatedAt)}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setForm(itemToForm(item));
                            setErrors({});
                            setSavedMessage("");
                          }}
                          className="inline-flex h-9 items-center gap-1 rounded-lg border border-blue-200 px-3 text-xs font-semibold text-blue-600 hover:bg-blue-50"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          编辑
                        </button>
                        <button
                          type="button"
                          disabled={mutatingId === item.id}
                          onClick={() => void handleDelete(item)}
                          className="inline-flex h-9 items-center gap-1 rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          {mutatingId === item.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                          删除
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            <footer className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                第 {pagination.page} 页，共 {Math.max(pagination.totalPages, 1)} 页，合计 {pagination.total} 条
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={!pagination.hasPreviousPage || loading}
                  onClick={() => void loadItems(pagination.page - 1)}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  上一页
                </button>
                <button
                  type="button"
                  disabled={!pagination.hasNextPage || loading}
                  onClick={() => void loadItems(pagination.page + 1)}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  下一页
                </button>
              </div>
            </footer>
          </section>
        </section>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">{formTitle}</h2>
              <p className="mt-1 text-xs text-slate-500">
                同一网点维护中英两套展示文案，官网按语言自动读取。
              </p>
            </div>
            {isEditing ? (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                aria-label="退出编辑"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          <Field label="网点编码" error={getFirstError(errors, "code")} required>
            <input
              value={form.code}
              disabled={submitting}
              onChange={(event) => updateForm("code", event.target.value)}
              placeholder="shenzhen-hq"
              className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="中文名称" error={getFirstError(errors, "nameZh")} required>
              <input
                value={form.nameZh}
                disabled={submitting}
                onChange={(event) => updateForm("nameZh", event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </Field>
            <Field label="英文名称" error={getFirstError(errors, "nameEn")} required>
              <input
                value={form.nameEn}
                disabled={submitting}
                onChange={(event) => updateForm("nameEn", event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="网点类型" error={getFirstError(errors, "type")} required>
              <select
                value={form.type}
                disabled={submitting}
                onChange={(event) => updateForm("type", event.target.value as LocationType)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                {Object.entries(typeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="国家代码" error={getFirstError(errors, "countryCode")} required>
              <input
                value={form.countryCode}
                disabled={submitting}
                onChange={(event) => updateForm("countryCode", event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm uppercase outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="中文国家" error={getFirstError(errors, "countryNameZh")} required>
              <input
                value={form.countryNameZh}
                disabled={submitting}
                onChange={(event) => updateForm("countryNameZh", event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </Field>
            <Field label="英文国家" error={getFirstError(errors, "countryNameEn")} required>
              <input
                value={form.countryNameEn}
                disabled={submitting}
                onChange={(event) => updateForm("countryNameEn", event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="中文省份">
              <input
                value={form.provinceNameZh}
                disabled={submitting}
                onChange={(event) => updateForm("provinceNameZh", event.target.value)}
                placeholder="广东省"
                className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </Field>
            <Field label="英文省份">
              <input
                value={form.provinceNameEn}
                disabled={submitting}
                onChange={(event) => updateForm("provinceNameEn", event.target.value)}
                placeholder="Guangdong"
                className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="中文城市">
              <input
                value={form.cityNameZh}
                disabled={submitting}
                onChange={(event) => updateForm("cityNameZh", event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </Field>
            <Field label="英文城市">
              <input
                value={form.cityNameEn}
                disabled={submitting}
                onChange={(event) => updateForm("cityNameEn", event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="经度" error={getFirstError(errors, "longitude")} required>
              <input
                type="number"
                step="0.000001"
                value={form.longitude}
                disabled={submitting}
                onChange={(event) => updateForm("longitude", event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </Field>
            <Field label="纬度" error={getFirstError(errors, "latitude")} required>
              <input
                type="number"
                step="0.000001"
                value={form.latitude}
                disabled={submitting}
                onChange={(event) => updateForm("latitude", event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="成立年份">
              <input
                value={form.establishment}
                disabled={submitting}
                onChange={(event) => updateForm("establishment", event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </Field>
            <Field label="员工数">
              <input
                type="number"
                min={0}
                value={form.staff}
                disabled={submitting}
                onChange={(event) => updateForm("staff", event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </Field>
          </div>

          <Field label="图片 URL">
            <input
              value={form.imageUrl}
              disabled={submitting}
              onChange={(event) => updateForm("imageUrl", event.target.value)}
              placeholder="/images/locations/shenzhen-hq.jpeg"
              className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="中文描述">
              <textarea
                value={form.descriptionZh}
                disabled={submitting}
                rows={4}
                onChange={(event) => updateForm("descriptionZh", event.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </Field>
            <Field label="英文描述">
              <textarea
                value={form.descriptionEn}
                disabled={submitting}
                rows={4}
                onChange={(event) => updateForm("descriptionEn", event.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="中文业务范围">
              <textarea
                value={form.businessScopeZh}
                disabled={submitting}
                rows={4}
                onChange={(event) => updateForm("businessScopeZh", event.target.value)}
                placeholder="一行一个业务范围"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </Field>
            <Field label="英文业务范围">
              <textarea
                value={form.businessScopeEn}
                disabled={submitting}
                rows={4}
                onChange={(event) => updateForm("businessScopeEn", event.target.value)}
                placeholder="One item per line"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="发布状态">
              <select
                value={form.status}
                disabled={submitting}
                onChange={(event) => updateForm("status", event.target.value as LocationStatus)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="DRAFT">草稿</option>
                <option value="PUBLISHED">已发布</option>
              </select>
            </Field>
            <Field label="排序值">
              <input
                type="number"
                value={form.sortOrder}
                disabled={submitting}
                onChange={(event) => updateForm("sortOrder", event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </Field>
            <label className="flex items-center gap-3 pt-7 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={form.enabled}
                disabled={submitting}
                onChange={(event) => updateForm("enabled", event.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              启用展示
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isEditing ? "保存修改" : "创建网点"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  required = false,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">
        {label} {required ? <span className="text-red-500">*</span> : null}
      </span>
      {children}
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </label>
  );
}
