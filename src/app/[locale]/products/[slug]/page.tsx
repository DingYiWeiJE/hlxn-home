import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  setRequestLocale,
} from "next-intl/server";
import type { Metadata } from "next";

import Navigation from "@/components/Navigation";
import Footer from "@/components/SiteFooter";
import { ProductTracker } from "@/components/analytics/Tracker";
import { getSiteOrigin } from "@/lib/site-origin";

type ProductLocale = "zh" | "en";

type PageProps = {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
};

type ProductImage = {
  id: string;
  url: string;
  originalName?: string | null;
  mimeType?: string;
  width: number | null;
  height: number | null;
  alt: string | null;
};

type ProductDetail = {
  id: string;
  locale: ProductLocale;
  name: string;
  slug: string;
  seriesName: string | null;

  category: {
    primary: {
      id: string;
      name: string;
      slug: string;
    };

    secondary: {
      id: string;
      name: string;
      slug: string;
    };
  };

  summaryParagraphs: unknown;
  highlights: unknown;
  introductionParagraphs: unknown;

  coverImage: ProductImage | null;
  introBackgroundImage: ProductImage | null;

  advantages: Array<{
    id: string;
    title: string;
    sortOrder: number;
    image: ProductImage;
  }>;

  specification: {
    title: string;
    headers: unknown;
    rows: unknown;
  } | null;

  keyParameters: {
    title: string;
    items: unknown;
  } | null;

  applications: Array<{
    id: string;
    title: string;
    sortOrder: number;
    image: ProductImage;
  }>;

  detailPdf: {
    id: string;
    originalName: string | null;
    filename: string;
    mimeType: string;
    size: number;
    downloadUrl: string;
  } | null;

  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  detailUrl: string;
};

type ProductApiResponse =
  | {
      success: true;
      data: ProductDetail;
    }
  | {
      success: false;
      error?: {
        code?: string;
        message?: string;
      };
    };

const labels = {
  zh: {
    productIntroduction: "产品介绍",
    productAdvantages: "产品优势",
    specifications: "规格参数",
    keyParameters: "主要技术参数",
    applications: "应用场景",
    downloadPdf: "下载产品资料",
    backToProducts: "返回产品中心",
    productCategory: "产品分类",
  },

  en: {
    productIntroduction:
      "Product Introduction",
    productAdvantages:
      "Product Advantages",
    specifications: "Specifications",
    keyParameters:
      "Key Technical Parameters",
    applications: "Applications",
    downloadPdf: "Download Product PDF",
    backToProducts: "Back to Products",
    productCategory: "Category",
  },
} satisfies Record<
  ProductLocale,
  Record<string, string>
>;

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const resolvedParams =
    await params;

  const locale =
    normalizeLocale(
      resolvedParams.locale,
    );

  const product =
    await fetchProductDetail(
      locale,
      resolvedParams.slug,
    );

  if (!product) {
    return {
      title:
        locale === "zh"
          ? "产品不存在 | 汉理新能"
          : "Product Not Found | Hanli Chuneng",
    };
  }

  const description =
    toStringArray(
      product.summaryParagraphs,
    )[0] ??
    (locale === "zh"
      ? `${product.name}产品详情`
      : `${product.name} product details`);

  return {
    title: `${product.name} | ${
      locale === "zh"
        ? "汉理新能"
        : "Hanli Chuneng"
    }`,

    description,

    alternates: {
      canonical:
        `/${locale}/products/${product.slug}`,
    },

    openGraph: {
      title: product.name,
      description,
      type: "website",

      images:
        product.coverImage?.url
          ? [
              {
                url:
                  product.coverImage
                    .url,
                alt:
                  product.coverImage
                    .alt ??
                  product.name,
              },
            ]
          : undefined,
    },
  };
}

export default async function ProductDetailPage({
  params,
}: PageProps) {
  const resolvedParams =
    await params;

  const locale =
    normalizeLocale(
      resolvedParams.locale,
    );

  setRequestLocale(locale);

  const product =
    await fetchProductDetail(
      locale,
      resolvedParams.slug,
    );

  if (!product) {
    notFound();
  }

  const text = labels[locale];

  const summaryParagraphs =
    toStringArray(
      product.summaryParagraphs,
    );

  const highlights =
    toStringArray(
      product.highlights,
    );

  const introductionParagraphs =
    toStringArray(
      product.introductionParagraphs,
    );

  const specificationHeaders =
    toStringArray(
      product.specification
        ?.headers,
    );

  const specificationRows =
    toStringMatrix(
      product.specification?.rows,
    );

  const hasIntroduction =
    introductionParagraphs.length >
      0 ||
    summaryParagraphs.length > 0;

  const hasAdvantages =
    product.advantages.length > 0;

  const hasSpecifications =
    Boolean(
      product.specification,
    ) &&
    specificationHeaders.length >
      0;

  const keyParameterItems =
    toKeyValueItems(
      product.keyParameters?.items,
    );

  const hasKeyParameters =
    keyParameterItems.length > 0;

  const hasApplications =
    product.applications.length >
    0;

  const hasDetailPdf = Boolean(
    product.detailPdf,
  );

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="border-b border-slate-100 bg-white">
        <Navigation hasbg/>
      </div>

      <ProductTracker productId={product.id} />

      <main className="flex-1">
        {/* 产品顶部主视觉 */}
        <section className="overflow-hidden bg-[#F7FAFC]">
          <div className="mx-auto grid min-h-[520px] w-full max-w-[1440px] items-center gap-10 px-5 py-14 sm:px-8 sm:py-16 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)] lg:px-12 lg:py-20">
            <div className="relative z-10">

              {product.seriesName ? (
                <p className="mt-8 text-lg font-bold tracking-wide text-[#2364c7] sm:text-xl">
                  {product.seriesName}
                </p>
              ) : null}

              <h1 className="mt-2 max-w-2xl text-[3rem] font-bold leading-tight text-[#2364c7]">
                {product.name}
              </h1>

              <div className="mt-6 max-w-2xl space-y-3 text-sm leading-7 text-slate-600 sm:text-base">
                {summaryParagraphs.map(
                  (
                    paragraph,
                    index,
                  ) => (
                    <p
                      key={index}
                    >
                      {paragraph}
                    </p>
                  ),
                )}
              </div>

              {highlights.length >
              0 ? (
                <div className="mt-7 flex flex-wrap gap-3">
                  {highlights.map(
                    (
                      highlight,
                      index,
                    ) => (
                      <span
                        key={`${highlight}-${index}`}
                        className="inline-flex min-h-10 items-center bg-[#2364c7] px-4 py-2 text-sm font-semibold text-white shadow-sm"
                      >
                        {highlight}
                      </span>
                    ),
                  )}
                </div>
              ) : null}


              {/* {product.detailPdf ? (
                <a
                  href={
                    product.detailPdf
                      .downloadUrl
                  }
                  className="mt-8 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#2364c7] bg-white px-5 text-sm font-semibold text-[#2364c7] transition hover:bg-[#2364c7] hover:text-white"
                >
                  <DownloadIcon />
                  {text.downloadPdf}
                </a>
              ) : null} */}
            </div>

            <div className="relative flex min-h-[300px] items-center justify-center sm:min-h-[400px] lg:min-h-[500px]">
              {product.coverImage?.url ? (
                <Image
                  src={
                    product.coverImage
                      .url
                  }
                  alt={
                    product.coverImage
                      .alt ||
                    product.name
                  }
                  fill
                  priority
                  unoptimized
                  sizes="
                    (max-width: 1023px) 100vw,
                    50vw
                  "
                  className="object-cover p-4 sm:p-8"
                />
              ) : (
                <div className="flex h-64 w-full items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white/70 text-sm text-slate-400">
                  {product.name}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 锚点导航 */}
        <nav className="sticky top-0 z-30 border-y border-slate-100 bg-white/95 shadow-sm backdrop-blur">
          <div className="mx-auto flex w-full max-w-[1100px] overflow-x-auto px-4 sm:justify-center sm:px-6">
            {hasIntroduction ? (
              <AnchorLink
                href="#introduction"
                label={
                  text.productIntroduction
                }
              />
            ) : null}

            {hasAdvantages ? (
              <AnchorLink
                href="#advantages"
                label={
                  text.productAdvantages
                }
              />
            ) : null}

            {hasSpecifications ? (
              <AnchorLink
                href="#specifications"
                label={
                  text.specifications
                }
              />
            ) : null}

            {hasKeyParameters ? (
              <AnchorLink
                href="#key-parameters"
                label={
                  text.keyParameters
                }
              />
            ) : null}

            {hasApplications ? (
              <AnchorLink
                href="#applications"
                label={
                  text.applications
                }
              />
            ) : null}
          </div>
        </nav>

        {/* 产品介绍 */}
        {hasIntroduction ? (
          <section
            id="introduction"
            className="scroll-mt-24"
          >
            <div
              className="relative flex min-h-[440px] items-center justify-center overflow-hidden bg-slate-800 px-5 py-16 sm:min-h-[520px] sm:px-8 lg:min-h-[620px]"
            >
              {product
                .introBackgroundImage
                ?.url ? (
                <Image
                  src={
                    product
                      .introBackgroundImage
                      .url
                  }
                  alt={
                    product
                      .introBackgroundImage
                      .alt ||
                    `${product.name}产品介绍`
                  }
                  fill
                  unoptimized
                  sizes="100vw"
                  className="object-cover"
                />
              ) : null}

              <div className="absolute inset-0 bg-slate-950/45" />

              <div className="relative z-10 mx-auto w-full max-w-4xl text-center text-white">
                <h2 className="text-[3rem] font-bold tracking-wide">
                  {
                    text.productIntroduction
                  }
                </h2>

                <div className="mx-auto mt-7 max-w-3xl space-y-4 text-sm leading-8 text-white/95 sm:text-base sm:leading-9">
                  {introductionParagraphs.length >
                  0 ? (
                    introductionParagraphs.map(
                      (
                        paragraph,
                        index,
                      ) => (
                        <p
                          className="intro"
                          key={index}
                        >
                          {
                            paragraph
                          }
                        </p>
                      ),
                    )
                  ) : (
                    summaryParagraphs.map(
                      (
                        paragraph,
                        index,
                      ) => (
                        <p
                          className="intro"
                          key={index}
                        >
                          {
                            paragraph
                          }
                        </p>
                      ),
                    )
                  )}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {/* 产品优势 */}
        {hasAdvantages ? (
          <section
            id="advantages"
            className="scroll-mt-24 bg-[#eaf7ff] px-5 py-16 sm:px-8 sm:py-20 lg:py-24"
          >
            <div className="mx-auto w-full max-w-[1100px]">
              <SectionTitle>
                {text.productAdvantages}
              </SectionTitle>

              <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {product.advantages.map(
                  (item) => (
                    <ProductFeatureCard
                      key={item.id}
                      title={
                        item.title
                      }
                      image={
                        item.image
                      }
                    />
                  ),
                )}
              </div>
            </div>
          </section>
        ) : null}

        {/* 规格参数 */}
        {hasSpecifications ? (
          <section
            id="specifications"
            className="scroll-mt-24 bg-white px-5 py-16 sm:px-8 sm:py-20 lg:py-24"
          >
            <div className="mx-auto w-full max-w-[900px]">
              <SectionTitle>
                {product.specification
                  ?.title ||
                  text.specifications}
              </SectionTitle>

              <div className="mt-10 overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[680px] border-collapse text-center text-sm">
                    <thead>
                      <tr className="bg-[#d9eef8] text-slate-800">
                        {specificationHeaders.map(
                          (
                            header,
                            index,
                          ) => (
                            <th
                              key={`${header}-${index}`}
                              className="border-b border-slate-200 px-5 py-4 font-bold"
                            >
                              {
                                header
                              }
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>

                    <tbody>
                      {specificationRows.map(
                        (
                          row,
                          rowIndex,
                        ) => (
                          <tr
                            key={
                              rowIndex
                            }
                            className={
                              rowIndex %
                                2 ===
                              0
                                ? "bg-white"
                                : "bg-slate-50"
                            }
                          >
                            {specificationHeaders.map(
                              (
                                _header,
                                cellIndex,
                              ) => (
                                <td
                                  key={
                                    cellIndex
                                  }
                                  className="border-b border-slate-100 px-5 py-4 text-slate-700"
                                >
                                  {row[
                                    cellIndex
                                  ] ??
                                    ""}
                                </td>
                              ),
                            )}
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {/* 主要技术参数 */}
        {hasKeyParameters ? (
          <section
            id="key-parameters"
            className="scroll-mt-24 bg-white px-5 py-16 sm:px-8 sm:py-20 lg:py-24"
          >
            <div className="mx-auto w-full max-w-[900px]">
              <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                <div className="bg-[#2364c7] px-6 py-5 text-center">
                  <h2 className="text-lg font-bold tracking-wide text-white sm:text-xl">
                    {product
                      .keyParameters
                      ?.title ||
                      text.keyParameters}
                  </h2>
                </div>

                <dl>
                  {keyParameterItems.map(
                    (item, index) => (
                      <div
                        key={`${item.key}-${index}`}
                        className={[
                          "grid grid-cols-[minmax(110px,32%)_1fr] items-center gap-4 border-b border-slate-100 px-5 py-4 last:border-b-0 sm:grid-cols-[220px_1fr] sm:px-8 sm:py-5",
                          index % 2 === 0
                            ? "bg-white"
                            : "bg-slate-100",
                        ].join(" ")}
                      >
                        <dt className="text-sm font-bold text-[#1f5aa8] sm:text-base">
                          {item.key}
                        </dt>

                        <dd className="text-sm leading-6 text-slate-700 sm:text-base">
                          {item.value}
                        </dd>
                      </div>
                    ),
                  )}
                </dl>
              </div>
            </div>
          </section>
        ) : null}

        {/* 应用场景 */}
        {hasApplications ? (
          <section
            id="applications"
            className="scroll-mt-24 bg-[#eaf7ff] px-5 py-16 sm:px-8 sm:py-20 lg:py-24"
          >
            <div className="mx-auto w-full max-w-[1000px]">
              <SectionTitle>
                {text.applications}
              </SectionTitle>

              <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2">
                {product.applications.map(
                  (item) => (
                    <ApplicationCard
                      key={item.id}
                      title={
                        item.title
                      }
                      image={
                        item.image
                      }
                    />
                  ),
                )}
              </div>
            </div>
          </section>
        ) : null}

      {hasDetailPdf ? (
        <div
          className="h-[300px] relative bg-cover bg-center flex flex-col items-center justify-center"
          style={{
            backgroundImage: "url('/images/products/dy.jpg')",
          }}
        >
          {/* 遮罩 */}
          <div className="absolute inset-0" style={{ backgroundColor: '#1A589BA6' }}></div>

          {/* 内容层 */}
          <div className="relative flex flex-col items-center justify-center gap-4 text-center">
            <h2 className="text-[3rem] font-bold text-white">下载产品单页</h2>
            <a
              href={
                product.detailPdf!
                  .downloadUrl
              }
              className="
                inline-flex items-center gap-3
                rounded-full bg-white
                px-7 py-3
                text-base font-medium text-slate-600
                shadow-sm
                transition-all duration-200
                hover:opacity-90 hover:shadow-md
              "
            >
              <span>点击查看</span>

              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path d="M5 12h14" />
                <path d="m13 6 6 6-6 6" />
              </svg>
            </a>
          </div>
        </div>
      ) : null}

      </main>

      <Footer locale={locale} />
    </div>
  );
}

function SectionTitle({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <h2 className="text-center text-[3rem] font-bold tracking-wide text-[#2364c7]">
      {children}
    </h2>
  );
}

function AnchorLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <a
      href={href}
      className="inline-flex min-h-14 shrink-0 items-center justify-center whitespace-nowrap px-5 text-sm font-semibold text-slate-600 transition hover:bg-blue-50 hover:text-[#2364c7] sm:px-7"
    >
      {label}
    </a>
  );
}

function ProductFeatureCard({
  title,
  image,
}: {
  title: string;
  image: ProductImage;
}) {
  return (
    <article className="group flex min-h-[180px] flex-col items-center justify-center overflow-hidden rounded-xl bg-white p-5 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="relative h-20 w-20 overflow-hidden">
        <Image
          src={image.url}
          alt={
            image.alt || title
          }
          fill
          unoptimized
          sizes="80px"
          className="object-cover transition duration-300 group-hover:scale-105"
        />
      </div>

      <h3 className="mt-5 text-lg font-bold text-slate-900">
        {title}
      </h3>
    </article>
  );
}

function ApplicationCard({
  title,
  image,
}: {
  title: string;
  image: ProductImage;
}) {
  return (
    <article className="group flex min-h-[190px] flex-col items-center justify-center overflow-hidden rounded-xl bg-white p-6 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg sm:min-h-[220px]">
      <div className="relative h-24 w-24 overflow-hidden">
        <Image
          src={image.url}
          alt={
            image.alt || title
          }
          fill
          unoptimized
          sizes="96px"
          className="object-cover transition duration-300 group-hover:scale-105"
        />
      </div>

      <h3 className="mt-5 text-lg font-bold text-slate-900 sm:text-xl">
        {title}
      </h3>
    </article>
  );
}

function normalizeLocale(
  value: string | undefined,
): ProductLocale {
  return value === "en"
    ? "en"
    : "zh";
}

function toStringArray(
  value: unknown,
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is string =>
      typeof item === "string" &&
      item.trim().length > 0,
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
      (
        item,
      ): item is Record<
        string,
        unknown
      > =>
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
    }))
    .filter(
      (item) =>
        item.key.trim().length > 0 &&
        item.value.trim().length > 0,
    );
}

async function fetchProductDetail(
  locale: ProductLocale,
  slug: string,
): Promise<ProductDetail | null> {
  try {
    const origin =
      await getSiteOrigin();

    const normalizedSlug =
      decodeURIComponent(
        slug,
      ).trim();

    if (!normalizedSlug) {
      return null;
    }

    const query =
      new URLSearchParams({
        locale,
      });

    const response =
      await fetch(
        `${origin}/api/products/${encodeURIComponent(
          normalizedSlug,
        )}?${query.toString()}`,
        {
          method: "GET",
          headers: {
            Accept:
              "application/json",
          },

          /*
           * 产品发布或修改后立即更新详情页。
           * 后续稳定后可改成 revalidate。
           */
          cache: "no-store",
        },
      );

    if (response.status === 404) {
      return null;
    }

    const result =
      (await response.json()) as ProductApiResponse;

    if (
      !response.ok ||
      !result.success
    ) {
      return null;
    }

    return result.data;
  } catch (error) {
    console.error(
      "产品详情获取失败：",
      error,
    );

    return null;
  }
}

