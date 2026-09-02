"use client";

import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  FileText,
  ImageIcon,
  Languages,
  Loader2,
  Package,
  Save,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { isQiniuUrl } from "@/lib/config";

import DynamicTextList from "@/components/admin/products/DynamicTextList";
import MediaAssetPicker, {
  type ProductMediaAsset,
} from "@/components/admin/products/MediaAssetPicker";
import ProductImageItemsEditor, {
  type ProductImageListItem,
} from "@/components/admin/products/ProductImageItemsEditor";
import ProductSpecificationEditor, {
  type ProductSpecificationValue,
} from "@/components/admin/products/ProductSpecificationEditor";
import ProductKeyParametersEditor, {
  type ProductKeyParametersValue,
} from "@/components/admin/products/ProductKeyParametersEditor";

type ProductLocale = "zh" | "en";

type ProductStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "OFFLINE";

type CategoryLevel =
  | "LEVEL_ONE"
  | "LEVEL_TWO";

type CategoryItem = {
  id: string;
  name: string;
  slug: string;
  level: CategoryLevel;
  parentId: string | null;
  sortOrder: number;
  enabled: boolean;

  parent: {
    id: string;
    name: string;
    slug: string;
  } | null;
};

type SelectedAsset = {
  id: string;
  type: "IMAGE" | "PDF";
  url?: string;
  filename?: string | null;
  originalName?: string | null;
  mimeType?: string;
  size?: number;
  width?: number | null;
  height?: number | null;
  alt?: string | null;
};

export type ProductFormInitialData = {
  id: string;
  locale: ProductLocale;
  name: string;
  slug: string;
  seriesName: string | null;
  secondaryCategoryId: string;

  summaryParagraphs: unknown;
  highlights: unknown;
  introductionParagraphs: unknown;

  coverImageAssetId: string | null;
  coverImage: SelectedAsset | null;

  introBackgroundImageAssetId?: string | null;
  introBackgroundImageAsset?: SelectedAsset | null;

  advantages: Array<{
    id: string;
    title: string;
    sortOrder: number;
    assetId: string;
    asset: SelectedAsset;
  }>;

  specification:
    | {
        title: string;
        headers: unknown;
        rows: unknown;
      }
    | null;

  keyParameters:
    | {
        title: string;
        items: unknown;
      }
    | null;

  applications: Array<{
    id: string;
    title: string;
    sortOrder: number;
    assetId: string;
    asset: SelectedAsset;
  }>;

  detailPdfAssetId: string | null;

  detailPdf: {
    id: string;
    type?: "PDF";
    originalName: string | null;
    filename: string;
    mimeType: string;
    size: number;
    downloadUrl: string;
  } | null;

  status: ProductStatus;
  sortOrder: number;
};

type ProductFormProps = {
  mode: "create" | "edit";
  initialData?: ProductFormInitialData;
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

type ProductMutationResponse =
  | {
      success: true;
      data: {
        id: string;
        name: string;
        locale: ProductLocale;
        slug: string;
      };
    }
  | ApiFailure;

function createClientId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function toStringArray(
  value: unknown,
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is string =>
      typeof item === "string",
  );
}

function toStringMatrix(
  value: unknown,
): string[][] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (row): row is unknown[] =>
        Array.isArray(row),
    )
    .map((row) =>
      row.map((cell) =>
        typeof cell === "string"
          ? cell
          : String(cell ?? ""),
      ),
    );
}

function normalizeSpecification(
  value:
    | ProductFormInitialData["specification"]
    | undefined,
): ProductSpecificationValue | null {
  if (!value) {
    return null;
  }

  return {
    title: value.title ?? "",
    headers: toStringArray(
      value.headers,
    ),
    rows: toStringMatrix(value.rows),
  };
}

function toKeyValueItems(
  value: unknown,
): Array<{
  key: string;
  value: string;
}> {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item): item is Record<string, unknown> =>
        typeof item === "object" &&
        item !== null,
    )
    .map((item) => ({
      key:
        typeof item.key === "string"
          ? item.key
          : "",
      value:
        typeof item.value === "string"
          ? item.value
          : "",
    }));
}

function normalizeKeyParameters(
  value:
    | ProductFormInitialData["keyParameters"]
    | undefined,
): ProductKeyParametersValue | null {
  if (!value) {
    return null;
  }

  return {
    title: value.title ?? "",
    items: toKeyValueItems(value.items),
  };
}

function normalizeImageItems(
  items:
    | ProductFormInitialData["advantages"]
    | ProductFormInitialData["applications"]
    | undefined,
): ProductImageListItem[] {
  if (!items) {
    return [];
  }

  return [...items]
    .sort(
      (a, b) =>
        a.sortOrder - b.sortOrder,
    )
    .map((item, index) => ({
      clientId: createClientId(),
      assetId: item.assetId,
      title: item.title,
      sortOrder: index,

      asset: {
        id: item.asset.id,
        url: item.asset.url ?? "",
        filename:
          item.asset.filename,
        originalName:
          item.asset.originalName,
        mimeType:
          item.asset.mimeType,
        size: item.asset.size,
        width: item.asset.width,
        height: item.asset.height,
        alt: item.asset.alt,
      },
    }));
}

function normalizeAsset(
  asset: ProductMediaAsset,
): SelectedAsset {
  return {
    id: asset.id,
    type: asset.type,
    url: asset.url,
    filename: asset.filename,
    originalName: asset.originalName,
    mimeType: asset.mimeType,
    size: asset.size,
    width: asset.width,
    height: asset.height,
    alt: asset.alt,
  };
}

function getErrorMessage(
  result:
    | CategoryListResponse
    | ProductMutationResponse,
): string {
  if (!result.success) {
    const fieldError = Object.values(
      result.error.fieldErrors,
    ).flat()[0];

    return (
      fieldError ||
      result.error.message
    );
  }

  return "请求失败，请稍后重试";
}

function cleanStringList(
  values: string[],
): string[] {
  return values
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatFileSize(
  bytes?: number,
): string {
  if (
    bytes === undefined ||
    !Number.isFinite(bytes)
  ) {
    return "大小未知";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(
      bytes / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    1024 /
    1024
  ).toFixed(1)} MB`;
}

export default function ProductForm({
  mode,
  initialData,
}: ProductFormProps) {
  const router = useRouter();

  const [locale, setLocale] =
    useState<ProductLocale>(
      initialData?.locale ?? "zh",
    );

  const [name, setName] = useState(
    initialData?.name ?? "",
  );

  const [seriesName, setSeriesName] =
    useState(
      initialData?.seriesName ?? "",
    );

  const [
    primaryCategoryId,
    setPrimaryCategoryId,
  ] = useState("");

  const [
    secondaryCategoryId,
    setSecondaryCategoryId,
  ] = useState(
    initialData?.secondaryCategoryId ??
      "",
  );

  const [
    summaryParagraphs,
    setSummaryParagraphs,
  ] = useState<string[]>(
    toStringArray(
      initialData?.summaryParagraphs,
    ),
  );

  const [highlights, setHighlights] =
    useState<string[]>(
      toStringArray(
        initialData?.highlights,
      ),
    );

  const [
    introductionParagraphs,
    setIntroductionParagraphs,
  ] = useState<string[]>(
    toStringArray(
      initialData?.introductionParagraphs,
    ),
  );

  const [coverImage, setCoverImage] =
    useState<SelectedAsset | null>(
      initialData?.coverImage ??
        (initialData?.coverImageAssetId
          ? {
              id: initialData.coverImageAssetId,
              type: "IMAGE",
            }
          : null),
    );

  const [
    introBackgroundImage,
    setIntroBackgroundImage,
  ] = useState<SelectedAsset | null>(
    initialData?.introBackgroundImageAsset ??
      (initialData?.introBackgroundImageAssetId
        ? {
            id:
              initialData.introBackgroundImageAssetId,
            type: "IMAGE",
          }
        : null),
  );

  const [advantages, setAdvantages] =
    useState<ProductImageListItem[]>(
      normalizeImageItems(
        initialData?.advantages,
      ),
    );

  const [
    specification,
    setSpecification,
  ] =
    useState<ProductSpecificationValue | null>(
      normalizeSpecification(
        initialData?.specification,
      ),
    );

  const [
    keyParameters,
    setKeyParameters,
  ] =
    useState<ProductKeyParametersValue | null>(
      normalizeKeyParameters(
        initialData?.keyParameters,
      ),
    );

  const [
    applications,
    setApplications,
  ] = useState<
    ProductImageListItem[]
  >(
    normalizeImageItems(
      initialData?.applications,
    ),
  );

  const [detailPdf, setDetailPdf] =
    useState<SelectedAsset | null>(
      initialData?.detailPdf
        ? {
            id: initialData.detailPdf.id,
            type: "PDF",
            filename:
              initialData.detailPdf
                .filename,
            originalName:
              initialData.detailPdf
                .originalName,
            mimeType:
              initialData.detailPdf
                .mimeType,
            size:
              initialData.detailPdf.size,
          }
        : null,
    );

  const [status, setStatus] =
    useState<ProductStatus>(
      initialData?.status ?? "DRAFT",
    );

  const [sortOrder, setSortOrder] =
    useState(
      String(
        initialData?.sortOrder ?? 0,
      ),
    );

  const [categories, setCategories] =
    useState<CategoryItem[]>([]);

  const [
    isLoadingCategories,
    setIsLoadingCategories,
  ] = useState(true);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [formError, setFormError] =
    useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [
    pickerTarget,
    setPickerTarget,
  ] = useState<
    | "COVER"
    | "INTRO_BACKGROUND"
    | "PDF"
    | null
  >(null);

  const loadCategories =
    useCallback(async () => {
      setIsLoadingCategories(true);

      try {
        const response = await fetch(
          "/api/admin/categories",
          {
            cache: "no-store",
          },
        );

        const result =
          (await response.json()) as CategoryListResponse;

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            getErrorMessage(result),
          );
        }

        setCategories(
          result.data.items,
        );

        if (
          secondaryCategoryId
        ) {
          const selectedCategory =
            result.data.items.find(
              (item) =>
                item.id ===
                secondaryCategoryId,
            );

          if (
            selectedCategory?.parentId
          ) {
            setPrimaryCategoryId(
              selectedCategory.parentId,
            );
          }
        }
      } catch (error) {
        setFormError(
          error instanceof Error
            ? error.message
            : "产品分类加载失败",
        );
      } finally {
        setIsLoadingCategories(false);
      }
    }, [secondaryCategoryId]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const primaryCategories = useMemo(
    () =>
      categories
        .filter(
          (item) =>
            item.level ===
              "LEVEL_ONE" &&
            item.enabled,
        )
        .sort(
          (a, b) =>
            a.sortOrder -
              b.sortOrder ||
            a.name.localeCompare(
              b.name,
            ),
        ),
    [categories],
  );

  const secondaryCategories =
    useMemo(
      () =>
        categories
          .filter(
            (item) =>
              item.level ===
                "LEVEL_TWO" &&
              item.enabled &&
              (!primaryCategoryId ||
                item.parentId ===
                  primaryCategoryId),
          )
          .sort(
            (a, b) =>
              a.sortOrder -
                b.sortOrder ||
              a.name.localeCompare(
                b.name,
              ),
          ),
      [
        categories,
        primaryCategoryId,
      ],
    );

  function handlePrimaryCategoryChange(
    value: string,
  ) {
    setPrimaryCategoryId(value);

    if (!secondaryCategoryId) {
      return;
    }

    const selectedSecondary =
      categories.find(
        (item) =>
          item.id ===
          secondaryCategoryId,
      );

    if (
      value &&
      selectedSecondary?.parentId !==
        value
    ) {
      setSecondaryCategoryId("");
    }
  }

  function handleSecondaryCategoryChange(
    value: string,
  ) {
    setSecondaryCategoryId(value);

    const selectedSecondary =
      categories.find(
        (item) => item.id === value,
      );

    if (
      selectedSecondary?.parentId
    ) {
      setPrimaryCategoryId(
        selectedSecondary.parentId,
      );
    }
  }

  function validateImageItems(
    items: ProductImageListItem[],
    label: string,
  ) {
    for (
      let index = 0;
      index < items.length;
      index += 1
    ) {
      const item = items[index];

      if (!item.assetId) {
        throw new Error(
          `${label}第 ${
            index + 1
          } 项尚未选择图片`,
        );
      }

      if (!item.title.trim()) {
        throw new Error(
          `${label}第 ${
            index + 1
          } 项尚未填写标题`,
        );
      }
    }
  }

  function buildSpecification():
    | ProductSpecificationValue
    | null {
    if (!specification) {
      return null;
    }

    const title =
      specification.title.trim();

    const headers =
      specification.headers.map(
        (header) => header.trim(),
      );

    if (!title) {
      throw new Error(
        "请填写规格表标题",
      );
    }

    if (
      headers.length === 0 ||
      headers.some(
        (header) => !header,
      )
    ) {
      throw new Error(
        "请完整填写规格表表头",
      );
    }

    const rows =
      specification.rows.map((row) =>
        headers.map(
          (_header, index) =>
            String(
              row[index] ?? "",
            ).trim(),
        ),
      );

    return {
      title,
      headers,
      rows,
    };
  }

  function buildKeyParameters():
    | ProductKeyParametersValue
    | null {
    if (!keyParameters) {
      return null;
    }

    const title =
      keyParameters.title.trim();

    if (!title) {
      throw new Error(
        "请填写主要技术参数标题",
      );
    }

    if (
      keyParameters.items.length === 0
    ) {
      throw new Error(
        "请至少添加一项主要技术参数",
      );
    }

    const items =
      keyParameters.items.map(
        (item, index) => {
          const key = item.key.trim();
          const value =
            item.value.trim();

          if (!key || !value) {
            throw new Error(
              `主要技术参数第 ${
                index + 1
              } 项尚未填写完整`,
            );
          }

          return { key, value };
        },
      );

    return {
      title,
      items,
    };
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setFormError("");
    setSuccessMessage("");

    try {
      const normalizedName =
        name.trim();

      if (!normalizedName) {
        throw new Error(
          "请填写产品名称",
        );
      }

      validateImageItems(
        advantages,
        "产品优势",
      );

      validateImageItems(
        applications,
        "应用场景",
      );

      const normalizedSpecification =
        buildSpecification();

      const normalizedKeyParameters =
        buildKeyParameters();

      setIsSubmitting(true);

      const payload = {
        locale,
        name: normalizedName,

        seriesName:
          seriesName.trim() || null,

        secondaryCategoryId,

        summaryParagraphs:
          cleanStringList(
            summaryParagraphs,
          ),

        highlights:
          cleanStringList(highlights),

        introductionParagraphs:
          cleanStringList(
            introductionParagraphs,
          ),

        coverImageAssetId:
          coverImage?.id ?? null,

        introBackgroundImageAssetId:
          introBackgroundImage?.id ??
          null,

        advantages:
          advantages.map(
            (item, index) => ({
              assetId: item.assetId,
              title: item.title.trim(),
              sortOrder: index,
            }),
          ),

        specification:
          normalizedSpecification,

        keyParameters:
          normalizedKeyParameters,

        applications:
          applications.map(
            (item, index) => ({
              assetId: item.assetId,
              title: item.title.trim(),
              sortOrder: index,
            }),
          ),

        detailPdfAssetId:
          detailPdf?.id ?? null,

        status,

        sortOrder:
          Number(sortOrder || 0),
      };

      const endpoint =
        mode === "create"
          ? "/api/admin/products"
          : `/api/admin/products/${initialData?.id}`;

      const response = await fetch(
        endpoint,
        {
          method:
            mode === "create"
              ? "POST"
              : "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(
            payload,
          ),
        },
      );

      const result =
        (await response.json()) as ProductMutationResponse;

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          getErrorMessage(result),
        );
      }

      if (mode === "create") {
        router.replace(
          `/admin/products/${result.data.id}/edit?created=1`,
        );

        router.refresh();
        return;
      }

      setSuccessMessage(
        "产品信息已保存",
      );

      router.refresh();

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "产品保存失败",
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="mx-auto w-full max-w-[1500px] px-5 py-8 sm:px-8 lg:px-10"
      >
        <header className="flex flex-col gap-5 border-b border-slate-200 pb-7 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <Link
              href="/admin/products"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-600"
            >
              <ArrowLeft className="h-4 w-4" />
              返回产品列表
            </Link>

            <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-blue-600">
              <Package className="h-4 w-4" />
              产品内容管理
            </div>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
              {mode === "create"
                ? "创建产品"
                : "编辑产品"}
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              产品语言在创建时必须选择。产品页面地址由系统根据产品名称自动生成，
              创建后修改产品名称不会改变原有页面地址。
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/products"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              取消
            </Link>

            <button
              type="submit"
              disabled={
                isSubmitting ||
                isLoadingCategories
              }
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}

              {isSubmitting
                ? "正在保存..."
                : mode === "create"
                  ? "创建产品"
                  : "保存修改"}
            </button>
          </div>
        </header>

        {formError ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
            {formError}
          </div>
        ) : null}

        {successMessage ? (
          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-700">
            <CheckCircle2 className="h-5 w-5" />
            {successMessage}
          </div>
        ) : null}

        <div className="mt-7 grid gap-7 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-7">
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-5 py-4">
                <h2 className="text-base font-bold text-slate-950">
                  基本信息
                </h2>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  设置产品语言、名称、系列、排序和所属分类。
                </p>
              </div>

              <div className="space-y-6 p-5">
                <div>
                  <span className="text-sm font-semibold text-slate-700">
                    产品语言
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </span>

                  <div className="mt-2 grid gap-3 sm:grid-cols-2">
                    {[
                      {
                        value: "zh",
                        label: "中文",
                        description:
                          "用于中文产品页面",
                      },
                      {
                        value: "en",
                        label: "英文",
                        description:
                          "用于英文产品页面",
                      },
                    ].map((item) => {
                      const selected =
                        locale ===
                        item.value;

                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() =>
                            setLocale(
                              item.value as ProductLocale,
                            )
                          }
                          className={[
                            "flex items-center gap-3 rounded-xl border p-4 text-left transition",
                            selected
                              ? "border-blue-600 bg-blue-50 ring-4 ring-blue-100"
                              : "border-slate-200 bg-white hover:border-slate-300",
                          ].join(" ")}
                        >
                          <span
                            className={[
                              "flex h-10 w-10 items-center justify-center rounded-xl",
                              selected
                                ? "bg-blue-600 text-white"
                                : "bg-slate-100 text-slate-500",
                            ].join(" ")}
                          >
                            <Languages className="h-5 w-5" />
                          </span>

                          <span>
                            <span className="block text-sm font-semibold text-slate-900">
                              {item.label}
                            </span>

                            <span className="mt-0.5 block text-xs text-slate-500">
                              {
                                item.description
                              }
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                  <InputField
                    id="productName"
                    label="产品名称"
                    value={name}
                    required
                    maxLength={200}
                    placeholder="例如：工业级储能系统"
                    onChange={setName}
                  />

                  <InputField
                    id="productSeries"
                    label="产品系列"
                    value={seriesName}
                    maxLength={200}
                    placeholder="例如：HES Series"
                    onChange={
                      setSeriesName
                    }
                  />
                </div>

                <div className="max-w-[220px]">
                  <InputField
                    id="productSortOrder"
                    label="排序值"
                    type="number"
                    min={0}
                    value={sortOrder}
                    placeholder="0"
                    onChange={setSortOrder}
                  />
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                  <SelectField
                    id="primaryCategory"
                    label="一级分类"
                    value={
                      primaryCategoryId
                    }
                    disabled={
                      isLoadingCategories
                    }
                    onChange={
                      handlePrimaryCategoryChange
                    }
                  >
                    <option value="">
                      全部一级分类
                    </option>

                    {primaryCategories.map(
                      (category) => (
                        <option
                          key={
                            category.id
                          }
                          value={
                            category.id
                          }
                        >
                          {
                            category.name
                          }
                        </option>
                      ),
                    )}
                  </SelectField>

                  <SelectField
                    id="secondaryCategory"
                    label="二级分类"
                    value={
                      secondaryCategoryId
                    }
                    required
                    disabled={
                      isLoadingCategories
                    }
                    onChange={
                      handleSecondaryCategoryChange
                    }
                  >
                    <option value="">
                      请选择二级分类
                    </option>

                    {secondaryCategories.map(
                      (category) => (
                        <option
                          key={
                            category.id
                          }
                          value={
                            category.id
                          }
                        >
                          {
                            category.name
                          }
                        </option>
                      ),
                    )}
                  </SelectField>
                </div>
              </div>
            </section>

            <DynamicTextList
              label="产品摘要"
              description="按照段落分别填写，前台会将每一项渲染为独立段落。"
              values={
                summaryParagraphs
              }
              onChange={
                setSummaryParagraphs
              }
              placeholder="请输入产品摘要段落"
              addButtonText="添加摘要段落"
              multiline
              maxItems={20}
              maxLength={3000}
            />

            <DynamicTextList
              label="产品亮点"
              description="每一项为一个独立亮点，可用于列表页或详情页重点展示。"
              values={highlights}
              onChange={setHighlights}
              placeholder="例如：高安全性磷酸铁锂电芯"
              addButtonText="添加产品亮点"
              maxItems={30}
              maxLength={500}
            />

            <DynamicTextList
              label="产品介绍"
              description="按照段落填写完整产品介绍，前台会保持段落结构。"
              values={
                introductionParagraphs
              }
              onChange={
                setIntroductionParagraphs
              }
              placeholder="请输入产品介绍段落"
              addButtonText="添加介绍段落"
              multiline
              maxItems={30}
              maxLength={5000}
            />

            <ProductImageItemsEditor
              label="产品优势"
              description="每项可选择已有优势图片，也可直接上传新的优势图片。"
              purpose="PRODUCT_ADVANTAGE"
              items={advantages}
              onChange={setAdvantages}
              addButtonText="添加产品优势"
              titlePlaceholder="例如：更高的系统安全性"
              emptyText="暂未添加产品优势"
              maxItems={30}
            />

            <ProductSpecificationEditor
              value={specification}
              onChange={
                setSpecification
              }
            />

            <ProductKeyParametersEditor
              value={keyParameters}
              onChange={
                setKeyParameters
              }
            />

            <ProductImageItemsEditor
              label="应用场景"
              description="每项可选择已有应用场景图片，也可直接上传新的应用场景图片。"
              purpose="PRODUCT_ADVANTAGE"
              items={applications}
              onChange={setApplications}
              addButtonText="添加应用场景"
              titlePlaceholder="例如：工商业园区"
              emptyText="暂未添加应用场景"
              maxItems={30}
            />
          </div>

          <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-5 py-4">
                <h2 className="text-sm font-bold text-slate-900">
                  发布设置
                </h2>
              </div>

              <div className="space-y-4 p-5">
                <SelectField
                  id="productStatus"
                  label="产品状态"
                  value={status}
                  onChange={(value) =>
                    setStatus(
                      value as ProductStatus,
                    )
                  }
                >
                  <option value="DRAFT">
                    草稿
                  </option>

                  <option value="PUBLISHED">
                    已发布
                  </option>

                  <option value="OFFLINE">
                    已下线
                  </option>
                </SelectField>

                <div
                  className={[
                    "rounded-xl border px-4 py-3 text-xs leading-5",
                    status ===
                    "PUBLISHED"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : status ===
                          "OFFLINE"
                        ? "border-slate-200 bg-slate-50 text-slate-600"
                        : "border-amber-200 bg-amber-50 text-amber-700",
                  ].join(" ")}
                >
                  {status ===
                  "PUBLISHED"
                    ? "保存后产品可以通过前台接口查询。"
                    : status ===
                        "OFFLINE"
                      ? "产品不会在前台展示，但仍保留在后台。"
                      : "草稿产品仅在后台保存，不会在前台展示。"}
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <h2 className="text-sm font-bold text-slate-900">
                  产品封面
                </h2>

                {coverImage ? (
                  <button
                    type="button"
                    onClick={() =>
                      setCoverImage(null)
                    }
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                    aria-label="移除产品封面"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>

              <div className="p-5">
                <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                  {coverImage?.url ? (
                    <Image
                      src={coverImage.url}
                      alt={
                        coverImage.alt ||
                        name ||
                        "产品封面"
                      }
                      fill
                      unoptimized={isQiniuUrl(coverImage.url)}
                      sizes="360px"
                      className="object-contain p-4"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-center text-slate-400">
                      <ImageIcon className="h-10 w-10" />

                      <p className="mt-3 text-xs font-medium">
                        尚未选择封面图片
                      </p>
                    </div>
                  )}
                </div>

                {coverImage ? (
                  <div className="mt-3 text-xs text-slate-500">
                    <p className="truncate font-medium text-slate-700">
                      {coverImage.originalName ||
                        coverImage.filename ||
                        "已选择图片"}
                    </p>

                    <p className="mt-1">
                      {coverImage.width &&
                      coverImage.height
                        ? `${coverImage.width} × ${coverImage.height}`
                        : "尺寸未知"}

                      {coverImage.size !==
                      undefined
                        ? ` · ${formatFileSize(
                            coverImage.size,
                          )}`
                        : ""}
                    </p>
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={() =>
                    setPickerTarget(
                      "COVER",
                    )
                  }
                  className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                >
                  <ImageIcon className="h-4 w-4" />

                  {coverImage
                    ? "更换或上传封面图片"
                    : "选择或上传封面图片"}
                </button>

              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <h2 className="text-sm font-bold text-slate-900">
                  产品介绍背景图
                </h2>

                {introBackgroundImage ? (
                  <button
                    type="button"
                    onClick={() =>
                      setIntroBackgroundImage(
                        null,
                      )
                    }
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                    aria-label="移除产品介绍背景图"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>

              <div className="p-5">
                <div className="relative flex aspect-[16/9] items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                  {introBackgroundImage?.url ? (
                    <Image
                      src={
                        introBackgroundImage.url
                      }
                      alt={
                        introBackgroundImage.alt ||
                        name ||
                        "产品介绍背景图"
                      }
                      fill
                      unoptimized={isQiniuUrl(introBackgroundImage.url)}
                      sizes="360px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center px-4 text-center text-slate-400">
                      <ImageIcon className="h-10 w-10" />

                      <p className="mt-3 text-xs font-medium">
                        尚未选择产品介绍背景图
                      </p>
                    </div>
                  )}
                </div>

                {introBackgroundImage ? (
                  <div className="mt-3 text-xs text-slate-500">
                    <p className="truncate font-medium text-slate-700">
                      {introBackgroundImage.originalName ||
                        introBackgroundImage.filename ||
                        "已选择背景图"}
                    </p>

                    <p className="mt-1">
                      {introBackgroundImage.width &&
                      introBackgroundImage.height
                        ? `${introBackgroundImage.width} × ${introBackgroundImage.height}`
                        : "尺寸未知"}

                      {introBackgroundImage.size !==
                      undefined
                        ? ` · ${formatFileSize(
                            introBackgroundImage.size,
                          )}`
                        : ""}
                    </p>
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={() =>
                    setPickerTarget(
                      "INTRO_BACKGROUND",
                    )
                  }
                  className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                >
                  <ImageIcon className="h-4 w-4" />

                  {introBackgroundImage
                    ? "更换或上传背景图"
                    : "选择或上传背景图"}
                </button>

                <p className="mt-3 text-center text-xs leading-5 text-slate-400">
                  该图片用于产品详情页的产品介绍背景区域，可选；不上传时该区域将使用纯色背景。
                </p>
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <h2 className="text-sm font-bold text-slate-900">
                  产品 PDF
                </h2>

                {detailPdf ? (
                  <button
                    type="button"
                    onClick={() =>
                      setDetailPdf(null)
                    }
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                    aria-label="移除产品 PDF"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>

              <div className="p-5">
                <div className="flex min-h-32 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 text-center">
                  <FileText
                    className={[
                      "h-10 w-10",
                      detailPdf
                        ? "text-violet-600"
                        : "text-slate-400",
                    ].join(" ")}
                  />

                  <p className="mt-3 max-w-full truncate text-sm font-semibold text-slate-700">
                    {detailPdf
                      ? detailPdf.originalName ||
                        detailPdf.filename ||
                        "已选择 PDF"
                      : "尚未选择 PDF"}
                  </p>

                  {detailPdf ? (
                    <p className="mt-1 text-xs text-slate-400">
                      {formatFileSize(
                        detailPdf.size,
                      )}
                    </p>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setPickerTarget("PDF")
                  }
                  className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 text-sm font-semibold text-violet-700 transition hover:bg-violet-100"
                >
                  <FileText className="h-4 w-4" />

                  {detailPdf
                    ? "更换或上传 PDF"
                    : "选择或上传 PDF"}
                </button>

              </div>
            </section>

            <button
              type="submit"
              disabled={
                isSubmitting ||
                isLoadingCategories
              }
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}

              {isSubmitting
                ? "正在保存..."
                : mode === "create"
                  ? "创建产品"
                  : "保存产品"}
            </button>
          </aside>
        </div>
      </form>

      <MediaAssetPicker
        open={pickerTarget !== null}
        type={
          pickerTarget === "PDF"
            ? "PDF"
            : "IMAGE"
        }
        purpose={
          pickerTarget === "COVER"
            ? "PRODUCT_COVER"
            : pickerTarget ===
                "INTRO_BACKGROUND"
              ? "PRODUCT_INTRO_BACKGROUND"
              : "GENERAL"
        }
        title={
          pickerTarget === "PDF"
            ? "选择或上传产品 PDF"
            : pickerTarget ===
                "INTRO_BACKGROUND"
              ? "选择或上传产品介绍背景图"
              : "选择或上传产品封面图片"
        }
        selectedAssetId={
          pickerTarget === "PDF"
            ? detailPdf?.id
            : pickerTarget ===
                "INTRO_BACKGROUND"
              ? introBackgroundImage?.id
              : coverImage?.id
        }
        uploadAlt={
          pickerTarget === "COVER"
            ? `${name || "产品"}封面`
            : pickerTarget ===
                "INTRO_BACKGROUND"
              ? `${name || "产品"}介绍背景图`
              : undefined
        }
        onSelect={(asset) => {
          if (
            pickerTarget === "PDF"
          ) {
            setDetailPdf(
              normalizeAsset(asset),
            );

            return;
          }

          if (
            pickerTarget ===
            "INTRO_BACKGROUND"
          ) {
            setIntroBackgroundImage(
              normalizeAsset(asset),
            );

            return;
          }

          setCoverImage(
            normalizeAsset(asset),
          );
        }}
        onClose={() =>
          setPickerTarget(null)
        }
      />
    </>
  );
}

function InputField({
  id,
  label,
  value,
  onChange,
  placeholder,
  required = false,
  type = "text",
  maxLength,
  min,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: "text" | "number";
  maxLength?: number;
  min?: number;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="text-sm font-semibold text-slate-700"
      >
        {label}

        {required ? (
          <span className="ml-1 text-red-500">
            *
          </span>
        ) : null}
      </label>

      <input
        id={id}
        type={type}
        value={value}
        required={required}
        maxLength={maxLength}
        min={min}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
    </div>
  );
}

function SelectField({
  id,
  label,
  value,
  onChange,
  children,
  required = false,
  disabled = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="text-sm font-semibold text-slate-700"
      >
        {label}

        {required ? (
          <span className="ml-1 text-red-500">
            *
          </span>
        ) : null}
      </label>

      <div className="relative mt-2">
        <select
          id={id}
          value={value}
          required={required}
          disabled={disabled}
          onChange={(event) =>
            onChange(event.target.value)
          }
          className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        >
          {children}
        </select>

        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>
    </div>
  );
}