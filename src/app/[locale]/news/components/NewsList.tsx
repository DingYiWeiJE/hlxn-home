"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

interface NewsItem {
  id: string;
  title: string;
  image: string;
  date: string;
  href: string;
}

const PAGE_SIZE = 6;

const mockNewsList: NewsItem[] = [
  {
    id: "1",
    title:
      "HANLY动态｜汉理新能源携手全球船燃检测龙头VPS，共建绿色航运新生态",
    image: "/images/news/news-01.jpg",
    date: "2026-07-01",
    href: "/news/hanly-vps-cooperation",
  },
  {
    id: "2",
    title:
      "武昌区领导走访调研汉理新能源，共话船舶新能源发展",
    image: "/images/news/news-02.jpg",
    date: "2026-06-03",
    href: "/news/wuchang-research",
  },
  {
    id: "3",
    title:
      "携手共进，聚力新程｜清华大学慈松教授团队一行到访汉理新能源",
    image: "/images/news/news-03.jpg",
    date: "2026-05-21",
    href: "/news/tsinghua-visit",
  },
  {
    id: "4",
    title:
      "氢启未来｜韩国VINSSEN金世勋博士一行到访汉理新能源",
    image: "/images/news/news-04.jpg",
    date: "2026-05-21",
    href: "/news/vinssen-visit",
  },
  {
    id: "5",
    title:
      "2026新加坡海事展：洞悉行业新风向，抢抓新机遇",
    image: "/images/news/news-05.jpg",
    date: "2026-04-01",
    href: "/news/singapore-maritime-exhibition",
  },
  {
    id: "6",
    title: "深耕市场，拓局前行，斩获新突破！",
    image: "/images/news/news-06.jpg",
    date: "2026-04-01",
    href: "/news/market-breakthrough",
  },
  {
    id: "7",
    title: "汉理新能源船舶绿色动力项目正式启动",
    image: "/images/news/news-07.jpg",
    date: "2026-03-20",
    href: "/news/green-power-project",
  },
  {
    id: "8",
    title: "船舶新能源技术交流会在武汉顺利举行",
    image: "/images/news/news-08.jpg",
    date: "2026-03-12",
    href: "/news/technology-conference",
  },
  {
    id: "9",
    title: "汉理新能源与行业合作伙伴达成战略合作",
    image: "/images/news/news-09.jpg",
    date: "2026-02-28",
    href: "/news/strategic-cooperation",
  },
  {
    id: "10",
    title: "绿色船舶动力系统完成阶段性测试",
    image: "/images/news/news-10.jpg",
    date: "2026-02-16",
    href: "/news/power-system-test",
  },
  {
    id: "11",
    title: "汉理新能源受邀参加船舶产业发展论坛",
    image: "/images/news/news-11.jpg",
    date: "2026-01-22",
    href: "/news/industry-forum",
  },
  {
    id: "12",
    title: "创新驱动发展，共建绿色航运产业新生态",
    image: "/images/news/news-12.jpg",
    date: "2026-01-08",
    href: "/news/green-shipping-ecosystem",
  },
  {
    id: "13",
    title: "船岸协同能源管理系统完成现场调试",
    image: "/images/news/news-13.jpg",
    date: "2025-12-26",
    href: "/news/energy-management-system",
  },
  {
    id: "14",
    title: "新能源船舶示范项目顺利完成首次航行",
    image: "/images/news/news-14.jpg",
    date: "2025-12-10",
    href: "/news/new-energy-ship",
  },
  {
    id: "15",
    title: "汉理新能源持续推进绿色船舶技术创新",
    image: "/images/news/news-15.jpg",
    date: "2025-11-22",
    href: "/news/green-ship-innovation",
  },
];

export default function NewsList() {
  const sectionRef = useRef<HTMLElement>(null);

  const [newsList, setNewsList] =
    useState<NewsItem[]>(mockNewsList);

  const [currentPage, setCurrentPage] =
    useState(1);

  const [jumpPage, setJumpPage] =
    useState("1");

  const [isLoading, setIsLoading] =
    useState(false);

  const totalPages = Math.max(
    1,
    Math.ceil(newsList.length / PAGE_SIZE),
  );

  const visibleNews = useMemo(() => {
    const startIndex =
      (currentPage - 1) * PAGE_SIZE;

    return newsList.slice(
      startIndex,
      startIndex + PAGE_SIZE,
    );
  }, [currentPage, newsList]);

  /**
   * 后续联调接口时，把这里替换成真实请求。
   */
  useEffect(() => {
    async function fetchNewsList() {
      try {
        setIsLoading(true);

        // 后续接口示例：
        //
        // const response = await fetch("/api/news");
        //
        // if (!response.ok) {
        //   throw new Error("新闻列表获取失败");
        // }
        //
        // const result = await response.json();
        // setNewsList(result.data ?? []);

        setNewsList(mockNewsList);
      } catch (error) {
        console.error("获取新闻列表失败：", error);
        setNewsList([]);
      } finally {
        setIsLoading(false);
      }
    }

    void fetchNewsList();
  }, []);

  function changePage(page: number) {
    const nextPage = Math.min(
      Math.max(page, 1),
      totalPages,
    );

    setCurrentPage(nextPage);
    setJumpPage(String(nextPage));

    window.requestAnimationFrame(() => {
      sectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  function handleJumpPage() {
    const page = Number(jumpPage);

    if (!Number.isFinite(page)) {
      setJumpPage(String(currentPage));
      return;
    }

    changePage(Math.trunc(page));
  }

  return (
    <section
      ref={sectionRef}
      className="
        w-full
        scroll-mt-24
        bg-white
        py-10
        sm:py-12
        lg:py-16
      "
    >
      <div
        className="
          mx-auto
          w-full
          max-w-[1360px]
          px-5
          sm:px-6
          lg:px-8
        "
      >
        {isLoading ? (
          <NewsListSkeleton />
        ) : visibleNews.length > 0 ? (
          <div
            className="
              grid
              grid-cols-1
              gap-6
              sm:grid-cols-2
              xl:grid-cols-3
            "
          >
            {visibleNews.map((item) => (
              <article
                key={item.id}
                className="
                  group
                  flex
                  h-full
                  flex-col
                  overflow-hidden
                  rounded-xl
                  border
                  border-slate-200/80
                  bg-white
                  shadow-[0_3px_14px_rgba(15,23,42,0.10)]
                  transition
                  duration-300
                  hover:-translate-y-1
                  hover:shadow-[0_14px_30px_rgba(15,23,42,0.14)]
                "
              >
                <Link
                  href={item.href}
                  aria-label={`查看新闻：${item.title}`}
                  className="
                    relative
                    block
                    aspect-[16/10]
                    overflow-hidden
                    bg-slate-100
                  "
                >
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="
                      (max-width: 639px) 100vw,
                      (max-width: 1279px) 50vw,
                      33vw
                    "
                    className="
                      object-cover
                      transition
                      duration-500
                      group-hover:scale-105
                    "
                  />

                  <div
                    className="
                      pointer-events-none
                      absolute
                      inset-0
                      bg-gradient-to-t
                      from-black/15
                      to-transparent
                      opacity-0
                      transition-opacity
                      group-hover:opacity-100
                    "
                  />
                </Link>

                <div
                  className="
                    flex
                    flex-1
                    flex-col
                    px-5
                    pb-5
                    pt-5
                    sm:px-6
                    sm:pb-6
                  "
                >
                  <h2
                    className="
                      line-clamp-2
                      text-[17px]
                      font-bold
                      leading-[1.65]
                      text-slate-900
                      transition-colors
                      group-hover:text-[#2463c5]
                      sm:text-lg
                    "
                  >
                    <Link href={item.href}>
                      {item.title}
                    </Link>
                  </h2>

                  <div
                    className="
                      mt-auto
                      flex
                      items-center
                      justify-between
                      gap-4
                      pt-5
                    "
                  >
                    <time
                      dateTime={item.date}
                      className="
                        text-sm
                        text-slate-400
                        sm:text-base
                      "
                    >
                      {item.date}
                    </time>

                    <Link
                      href={item.href}
                      aria-label={`查看详情：${item.title}`}
                      className="
                        flex
                        shrink-0
                        items-center
                        gap-1
                        text-sm
                        font-medium
                        text-[#2463c5]
                        transition-transform
                        hover:translate-x-1
                      "
                    >
                      查看详情

                      <svg
                        viewBox="0 0 20 20"
                        fill="none"
                        aria-hidden="true"
                        className="h-4 w-4"
                      >
                        <path
                          d="M4 10h11m-4-4 4 4-4 4"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div
            className="
              flex
              min-h-64
              items-center
              justify-center
              rounded-2xl
              border
              border-dashed
              border-slate-300
              bg-slate-50
              px-6
              text-center
              text-slate-500
            "
          >
            暂无新闻内容
          </div>
        )}

        {!isLoading && totalPages > 1 && (
          <nav
            aria-label="新闻列表分页"
            className="
              mt-10
              flex
              flex-col
              items-center
              justify-center
              gap-5
              sm:mt-12
              lg:flex-row
            "
          >
            <p
              className="
                text-sm
                text-slate-500
                sm:text-base
              "
            >
              当前第
              <span
                className="
                  mx-1
                  font-semibold
                  text-slate-900
                "
              >
                {currentPage}
              </span>
              页 / 共
              <span
                className="
                  mx-1
                  font-semibold
                  text-slate-900
                "
              >
                {totalPages}
              </span>
              页
            </p>

            <div
              className="
                flex
                flex-wrap
                items-center
                justify-center
                gap-2
              "
            >
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() =>
                  changePage(currentPage - 1)
                }
                className="
                  flex
                  h-11
                  items-center
                  justify-center
                  rounded-lg
                  border
                  border-slate-200
                  bg-white
                  px-4
                  text-sm
                  text-slate-700
                  transition
                  hover:border-[#2463c5]
                  hover:text-[#2463c5]
                  disabled:cursor-not-allowed
                  disabled:opacity-40
                "
              >
                上一页
              </button>

              {Array.from(
                { length: totalPages },
                (_, index) => index + 1,
              ).map((page) => {
                const isCurrent =
                  page === currentPage;

                return (
                  <button
                    key={page}
                    type="button"
                    aria-current={
                      isCurrent
                        ? "page"
                        : undefined
                    }
                    aria-label={`前往第 ${page} 页`}
                    onClick={() =>
                      changePage(page)
                    }
                    className={[
                      "flex h-11 min-w-11",
                      "items-center justify-center",
                      "rounded-lg border px-3",
                      "font-medium transition",
                      isCurrent
                        ? "border-[#087fb8] bg-[#087fb8] text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:border-[#2463c5] hover:text-[#2463c5]",
                    ].join(" ")}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                type="button"
                disabled={
                  currentPage === totalPages
                }
                onClick={() =>
                  changePage(currentPage + 1)
                }
                className="
                  flex
                  h-11
                  items-center
                  justify-center
                  rounded-lg
                  border
                  border-slate-200
                  bg-white
                  px-4
                  text-sm
                  text-slate-700
                  transition
                  hover:border-[#2463c5]
                  hover:text-[#2463c5]
                  disabled:cursor-not-allowed
                  disabled:opacity-40
                "
              >
                下一页
              </button>
            </div>

            <div
              className="
                hidden
                items-center
                gap-2
                sm:flex
              "
            >
              <label
                htmlFor="news-jump-page"
                className="
                  text-sm
                  text-slate-600
                  sm:text-base
                "
              >
                跳转至
              </label>

              <input
                id="news-jump-page"
                type="number"
                min={1}
                max={totalPages}
                value={jumpPage}
                onChange={(event) =>
                  setJumpPage(
                    event.target.value,
                  )
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleJumpPage();
                  }
                }}
                className="
                  h-11
                  w-20
                  rounded-lg
                  border
                  border-slate-200
                  bg-white
                  px-3
                  text-center
                  text-slate-800
                  outline-none
                  transition
                  focus:border-[#2463c5]
                  focus:ring-2
                  focus:ring-blue-100
                "
              />

              <span
                className="
                  text-sm
                  text-slate-600
                  sm:text-base
                "
              >
                页
              </span>

              <button
                type="button"
                onClick={handleJumpPage}
                className="
                  h-11
                  rounded-lg
                  bg-slate-900
                  px-4
                  text-sm
                  font-medium
                  text-white
                  transition
                  hover:bg-[#2463c5]
                "
              >
                跳转
              </button>
            </div>
          </nav>
        )}
      </div>
    </section>
  );
}

function NewsListSkeleton() {
  return (
    <div
      className="
        grid
        grid-cols-1
        gap-6
        sm:grid-cols-2
        xl:grid-cols-3
      "
    >
      {Array.from({ length: 6 }).map(
        (_, index) => (
          <div
            key={index}
            className="
              overflow-hidden
              rounded-xl
              border
              border-slate-200
              bg-white
            "
          >
            <div
              className="
                aspect-[16/10]
                animate-pulse
                bg-slate-200
              "
            />

            <div className="space-y-4 p-5 sm:p-6">
              <div
                className="
                  h-5
                  animate-pulse
                  rounded
                  bg-slate-200
                "
              />

              <div
                className="
                  h-5
                  w-3/4
                  animate-pulse
                  rounded
                  bg-slate-200
                "
              />

              <div
                className="
                  mt-6
                  h-4
                  w-24
                  animate-pulse
                  rounded
                  bg-slate-200
                "
              />
            </div>
          </div>
        ),
      )}
    </div>
  );
}