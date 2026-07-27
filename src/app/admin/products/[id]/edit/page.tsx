"use client";

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  useParams,
  useSearchParams,
} from "next/navigation";

import ProductForm, {
  type ProductFormInitialData,
} from "@/components/admin/products/ProductForm";

type ApiFailure = {
  success: false;
  error: {
    code: string;
    message: string;
    fieldErrors: Record<
      string,
      string[]
    >;
  };
};

type ProductDetailResponse =
  | {
      success: true;
      data: ProductFormInitialData;
    }
  | ApiFailure;

function getErrorMessage(
  result: ProductDetailResponse,
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

  return "产品加载失败";
}

export default function EditProductPage() {
  const params = useParams<{
    id: string;
  }>();

  const searchParams =
    useSearchParams();

  const productId = params.id;

  const [product, setProduct] =
    useState<ProductFormInitialData | null>(
      null,
    );

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const wasCreated =
    searchParams.get("created") === "1";

  const loadProduct =
    useCallback(async () => {
      if (!productId) {
        setError("产品 ID 无效");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(
          `/api/admin/products/${productId}`,
          {
            method: "GET",
            cache: "no-store",
          },
        );

        const result =
          (await response.json()) as ProductDetailResponse;

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            getErrorMessage(result),
          );
        }

        setProduct(result.data);
      } catch (loadError) {
        setProduct(null);

        setError(
          loadError instanceof Error
            ? loadError.message
            : "产品加载失败",
        );
      } finally {
        setIsLoading(false);
      }
    }, [productId]);

  useEffect(() => {
    void loadProduct();
  }, [loadProduct]);

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-5">
        <div className="flex flex-col items-center text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />

          <h1 className="mt-4 text-base font-semibold text-slate-800">
            正在加载产品信息
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            请稍候，正在读取产品详情。
          </p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-2xl items-center justify-center px-5 py-10">
        <section className="w-full rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <AlertCircle className="h-7 w-7" />
          </span>

          <h1 className="mt-5 text-xl font-bold text-slate-950">
            产品信息加载失败
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            {error ||
              "当前产品不存在或已被删除。"}
          </p>

          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/admin/products"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              返回产品列表
            </Link>

            <button
              type="button"
              onClick={() =>
                void loadProduct()
              }
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4" />
              重新加载
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <>
      {wasCreated ? (
        <div className="mx-auto w-full max-w-[1500px] px-5 pt-6 sm:px-8 lg:px-10">
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

            <div>
              <p className="font-semibold">
                产品创建成功
              </p>

              <p className="mt-1 text-xs leading-5 text-emerald-600">
                当前已经进入编辑页面，可以继续完善内容或调整发布状态。
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <ProductForm
        mode="edit"
        initialData={product}
      />
    </>
  );
}