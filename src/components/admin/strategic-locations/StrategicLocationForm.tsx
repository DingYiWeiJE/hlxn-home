"use client";

import {
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  type FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";
import StrategicLocationImagePicker from "./StrategicLocationImagePicker";

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
  addressZh: string | null;
  addressEn: string | null;
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
  addressZh: string;
  addressEn: string;
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

type ItemResponse =
  | {
      success: true;
      data: StrategicLocationItem;
    }
  | {
      success: false;
      error: {
        message: string;
        fieldErrors?: FieldErrors;
      };
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
  addressZh: "",
  addressEn: "",
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
    addressZh: item.addressZh ?? "",
    addressEn: item.addressEn ?? "",
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

function generateCode(nameZh: string, cityZh: string, type: LocationType): string {
  const typeMap: Record<LocationType, string> = {
    HEADQUARTERS: "hq",
    BRANCH: "br",
    MARKETING: "mk",
    SERVICE: "sv",
  };

  const typePrefix = typeMap[type];
  const city = cityZh ? (cityZh.substring(0, 2).toLowerCase().replace(/[一-龥]/g, "")) : "";
  const name = nameZh ? nameZh.substring(0, 2).toLowerCase().replace(/[一-龥]/g, "") : "";

  if (city) {
    return `${city}-${typePrefix}`.toLowerCase();
  }
  if (name) {
    return `${name}-${typePrefix}`.toLowerCase();
  }
  return typePrefix.toLowerCase();
}

function getCountryCodeFromName(countryNameZh: string): string {
  const countryMap: Record<string, string> = {
    中国: "CN",
    美国: "US",
    日本: "JP",
    韩国: "KR",
    英国: "GB",
    法国: "FR",
    德国: "DE",
    加拿大: "CA",
    澳大利亚: "AU",
    印度: "IN",
    新加坡: "SG",
    马来西亚: "MY",
    泰国: "TH",
    越南: "VN",
    印度尼西亚: "ID",
    菲律宾: "PH",
    巴西: "BR",
    墨西哥: "MX",
  };
  return countryMap[countryNameZh] || "CN";
}

export default function StrategicLocationForm({
  mode,
  params,
}: {
  mode: "create" | "edit";
  params?: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [id, setId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(mode === "edit");

  useEffect(() => {
    if (mode === "edit" && params) {
      (async () => {
        try {
          const { id: itemId } = await params;
          setId(itemId);

          const response = await fetch(
            `/api/admin/strategic-locations/${itemId}`,
            {
              credentials: "include",
            },
          );
          const result = (await response.json()) as ItemResponse;

          if (!response.ok || !result.success) {
            throw new Error(
              result.success
                ? "加载失败"
                : result.error.fieldErrors
                  ? Object.values(result.error.fieldErrors).flat()[0]
                  : result.error.message,
            );
          }

          setForm(itemToForm(result.data));
        } catch (error) {
          setServerError(
            error instanceof Error ? error.message : "加载失败",
          );
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [mode, params]);

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setSubmitting(true);
    setErrors({});
    setServerError("");

    try {
      const generatedCode = form.code || generateCode(form.nameZh, form.cityNameZh, form.type);
      const mappedCountryCode = getCountryCodeFromName(form.countryNameZh);

      const payload = {
        code: generatedCode.trim(),
        nameZh: form.nameZh.trim(),
        nameEn: form.nameEn.trim(),
        type: form.type,
        countryCode: mappedCountryCode,
        countryNameZh: form.countryNameZh.trim(),
        countryNameEn: form.countryNameEn.trim(),
        provinceNameZh: form.provinceNameZh.trim() || null,
        provinceNameEn: form.provinceNameEn.trim() || null,
        cityNameZh: form.cityNameZh.trim() || null,
        cityNameEn: form.cityNameEn.trim() || null,
        addressZh: form.addressZh.trim() || null,
        addressEn: form.addressEn.trim() || null,
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
        mode === "edit" && form.id
          ? `/api/admin/strategic-locations/${form.id}`
          : "/api/admin/strategic-locations",
        {
          method: mode === "edit" ? "PATCH" : "POST",
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
        throw new Error(
          result.success
            ? "保存失败"
            : result.error.fieldErrors
              ? Object.values(result.error.fieldErrors).flat()[0]
              : result.error.message,
        );
      }

      router.push("/admin/strategic-locations");
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "保存失败");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-96 items-center justify-center text-sm text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        正在加载数据
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-blue-600 hover:text-blue-700 underline"
        >
          ← 返回列表
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">
            {mode === "create" ? "新建战略网点" : "编辑战略网点"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            同一网点维护中英两套展示文案，官网按语言自动读取。
          </p>
        </div>

        {serverError ? (
          <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="h-5 w-5 shrink-0" />
            {serverError}
          </div>
        ) : null}

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
          <Field label="中文详细地址">
            <input
              value={form.addressZh}
              disabled={submitting}
              onChange={(event) => updateForm("addressZh", event.target.value)}
              placeholder="如：深圳市南山区科技路1号"
              className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </Field>
          <Field label="英文详细地址">
            <input
              value={form.addressEn}
              disabled={submitting}
              onChange={(event) => updateForm("addressEn", event.target.value)}
              placeholder="e.g. Technology Road 1, Nanshan District, Shenzhen"
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

        <div>
          <a
            href="https://mylocationapp.com/zh/address-to-coordinates/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-50 px-4 text-sm font-medium text-blue-600 hover:bg-blue-100 transition"
          >
            使用地址转换经纬度工具
          </a>
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

        <div>
          <Field label="图片">
            <StrategicLocationImagePicker
              selected={form.imageUrl}
              onChange={(url) => updateForm("imageUrl", url)}
              onRemove={() => updateForm("imageUrl", "")}
              disabled={submitting}
            />
          </Field>
        </div>

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
          {mode === "create" ? "创建网点" : "保存修改"}
        </button>
      </form>
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
