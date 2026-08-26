import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api/response";
import { AnalyticsResourceType } from "@prisma/client";

const querySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  groupBy: z.enum(["day", "week", "month"]).default("day"),
});

/**
 * 获取时间范围的开始和结束日期
 * 注意：所有日期都基于本地时区的午夜
 */
function getDateRange(
  preset?: string,
  startDate?: string,
  endDate?: string,
): { start: Date; end: Date } {
  const now = new Date();
  // 创建本地时区的午夜时间
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let start: Date;
  let end = new Date(today);
  end.setDate(end.getDate() + 1); // 明天的开始时刻 = 今天的结束时刻

  if (preset === "today") {
    start = new Date(today);
  } else if (preset === "week") {
    // 周日 = 0, 周一 = 1, ..., 周六 = 6
    // 计算本周一
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek;
    start = new Date(today.getFullYear(), today.getMonth(), diff);
  } else if (preset === "month") {
    start = new Date(today.getFullYear(), today.getMonth(), 1);
    end = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  } else if (startDate && endDate) {
    start = new Date(startDate);
    end = new Date(endDate);
    end.setDate(end.getDate() + 1); // 设为下一天的开始
  } else {
    // 默认今天
    start = new Date(today);
  }

  return { start, end };
}

/**
 * 按日期分组统计趋势（官网 + 联系）
 */
function groupByDayTrend(
  sessionItems: Array<{ date: Date; count: number }>,
  contactItems: Array<{ date: Date; count: number }>,
  startDate: Date,
  endDate: Date,
): Array<{ date: string; websiteVisits: number; contactVisits: number }> {
  const result: Record<
    string,
    { websiteVisits: number; contactVisits: number }
  > = {};

  // 使用本地日期生成日期字符串
  const current = new Date(startDate);

  // 初始化所有日期为 0
  while (current < endDate) {
    const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`;
    result[dateStr] = { websiteVisits: 0, contactVisits: 0 };
    current.setDate(current.getDate() + 1);
  }

  // 填充官网访问数据
  sessionItems.forEach((item) => {
    const dateStr = `${item.date.getFullYear()}-${String(item.date.getMonth() + 1).padStart(2, "0")}-${String(item.date.getDate()).padStart(2, "0")}`;
    if (result[dateStr]) {
      result[dateStr].websiteVisits = item.count;
    }
  });

  // 填充联系我们访问数据
  contactItems.forEach((item) => {
    const dateStr = `${item.date.getFullYear()}-${String(item.date.getMonth() + 1).padStart(2, "0")}-${String(item.date.getDate()).padStart(2, "0")}`;
    if (result[dateStr]) {
      result[dateStr].contactVisits = item.count;
    }
  });

  return Object.entries(result).map(([date, data]) => ({
    date,
    ...data,
  }));
}

/**
 * 按周分组统计趋势（官网 + 联系）
 */
function groupByWeekTrend(
  sessionItems: Array<{ date: Date; count: number }>,
  contactItems: Array<{ date: Date; count: number }>,
  startDate: Date,
  endDate: Date,
): Array<{ date: string; websiteVisits: number; contactVisits: number }> {
  const result: Record<
    string,
    { websiteVisits: number; contactVisits: number }
  > = {};

  const dayOfWeek = startDate.getDay();
  const current = new Date(startDate);
  current.setDate(current.getDate() - dayOfWeek);

  // 初始化所有周
  while (current < endDate) {
    const weekStart = new Date(current);
    const weekKey = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, "0")}-${String(weekStart.getDate()).padStart(2, "0")}`;
    result[weekKey] = { websiteVisits: 0, contactVisits: 0 };
    current.setDate(current.getDate() + 7);
  }

  // 填充官网访问数据
  sessionItems.forEach((item) => {
    const dateOfWeek = item.date.getDay();
    const weekStart = new Date(item.date);
    weekStart.setDate(weekStart.getDate() - dateOfWeek);
    const weekKey = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, "0")}-${String(weekStart.getDate()).padStart(2, "0")}`;
    if (result[weekKey]) {
      result[weekKey].websiteVisits += item.count;
    }
  });

  // 填充联系我们访问数据
  contactItems.forEach((item) => {
    const dateOfWeek = item.date.getDay();
    const weekStart = new Date(item.date);
    weekStart.setDate(weekStart.getDate() - dateOfWeek);
    const weekKey = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, "0")}-${String(weekStart.getDate()).padStart(2, "0")}`;
    if (result[weekKey]) {
      result[weekKey].contactVisits += item.count;
    }
  });

  return Object.entries(result).map(([date, data]) => ({
    date,
    ...data,
  }));
}

/**
 * 按月分组统计趋势（官网 + 联系）
 */
function groupByMonthTrend(
  sessionItems: Array<{ date: Date; count: number }>,
  contactItems: Array<{ date: Date; count: number }>,
  startDate: Date,
  endDate: Date,
): Array<{ date: string; websiteVisits: number; contactVisits: number }> {
  const result: Record<
    string,
    { websiteVisits: number; contactVisits: number }
  > = {};

  const startYear = startDate.getFullYear();
  const startMonth = startDate.getMonth();
  const endYear = endDate.getFullYear();
  const endMonth = endDate.getMonth();

  // 初始化所有月份
  let year = startYear;
  let month = startMonth;

  while (year < endYear || (year === endYear && month < endMonth)) {
    const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;
    result[monthStr] = { websiteVisits: 0, contactVisits: 0 };
    month++;
    if (month > 11) {
      month = 0;
      year++;
    }
  }

  // 填充官网访问数据
  sessionItems.forEach((item) => {
    const year = item.date.getFullYear();
    const month = item.date.getMonth();
    const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;
    if (result[monthStr]) {
      result[monthStr].websiteVisits += item.count;
    }
  });

  // 填充联系我们访问数据
  contactItems.forEach((item) => {
    const year = item.date.getFullYear();
    const month = item.date.getMonth();
    const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;
    if (result[monthStr]) {
      result[monthStr].contactVisits += item.count;
    }
  });

  return Object.entries(result).map(([date, data]) => ({
    date,
    ...data,
  }));
}

/**
 * 按日期分组统计
 */
function groupByDay(
  items: Array<{ date: Date; count: number }>,
  startDate: Date,
  endDate: Date,
): Array<{ date: string; value: number }> {
  const result: Record<string, number> = {};
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);

  // 初始化所有日期为 0
  while (current <= endDate) {
    const dateStr = current.toISOString().split("T")[0];
    result[dateStr] = 0;
    current.setDate(current.getDate() + 1);
  }

  // 填充实际数据
  items.forEach((item) => {
    const dateStr = item.date.toISOString().split("T")[0];
    result[dateStr] = item.count;
  });

  return Object.entries(result).map(([date, value]) => ({
    date,
    value,
  }));
}

/**
 * 按周分组统计
 */
function groupByWeek(
  items: Array<{ date: Date; count: number }>,
  startDate: Date,
  endDate: Date,
): Array<{ date: string; value: number; week: number }> {
  const result: Record<string, { count: number; weekStart: string }> = {};
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);
  const dayOfWeek = current.getDay();
  current.setDate(current.getDate() - dayOfWeek);

  // 初始化所有周
  while (current <= endDate) {
    const weekStart = new Date(current);
    const weekEnd = new Date(current);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const key = weekStart.toISOString().split("T")[0];
    result[key] = { count: 0, weekStart: key };

    current.setDate(current.getDate() + 7);
  }

  // 填充实际数据
  items.forEach((item) => {
    const dateOfWeek = item.date.getDay();
    const weekStart = new Date(item.date);
    weekStart.setDate(weekStart.getDate() - dateOfWeek);
    weekStart.setHours(0, 0, 0, 0);

    const key = weekStart.toISOString().split("T")[0];
    if (result[key]) {
      result[key].count += item.count;
    }
  });

  return Object.values(result).map((item, index) => ({
    date: item.weekStart,
    value: item.count,
    week: index + 1,
  }));
}

/**
 * 按月分组统计
 */
function groupByMonth(
  items: Array<{ date: Date; count: number }>,
  startDate: Date,
  endDate: Date,
): Array<{ date: string; value: number; month: number }> {
  const result: Record<string, number> = {};

  // 使用本地日期而不是 ISO 字符串来避免时区问题
  const startYear = startDate.getFullYear();
  const startMonth = startDate.getMonth();
  const endYear = endDate.getFullYear();
  const endMonth = endDate.getMonth();

  // 初始化所有月份
  let year = startYear;
  let month = startMonth;

  while (year < endYear || (year === endYear && month <= endMonth)) {
    const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;
    result[monthStr] = 0;

    month++;
    if (month > 11) {
      month = 0;
      year++;
    }
  }

  // 填充实际数据
  items.forEach((item) => {
    const year = item.date.getFullYear();
    const month = item.date.getMonth();
    const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;
    if (result[monthStr] !== undefined) {
      result[monthStr] += item.count;
    }
  });

  return Object.entries(result)
    .map(([month, value], index) => ({
      date: month,
      value,
      month: index + 1,
    }));
}

/**
 * 获取官网访问次数（按 Session 统计，排除 Bot）
 */
async function getWebsiteVisits(
  startDate: Date,
  endDate: Date,
): Promise<number> {
  const result = await prisma.analyticsSession.count({
    where: {
      isBot: false,
      startedAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  return Number(result);
}

/**
 * 获取"联系我们"访问次数
 */
async function getContactViews(
  startDate: Date,
  endDate: Date,
): Promise<number> {
  const result = await prisma.analyticsPageView.count({
    where: {
      resourceType: "contact" as AnalyticsResourceType,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  return Number(result);
}

/**
 * 获取访问趋势数据（官网访问 + 联系我们访问）
 */
async function getVisitTrend(
  startDate: Date,
  endDate: Date,
  groupBy: "day" | "week" | "month",
): Promise<Array<{ date: string; websiteVisits: number; contactVisits: number }>> {
  // 获取官网访问趋势（Session）
  const sessionData = await prisma.$queryRaw<
    Array<{ date: Date; count: bigint }>
  >`
    SELECT
      DATE_TRUNC('day', "startedAt") as date,
      COUNT(*) as count
    FROM "AnalyticsSession"
    WHERE "isBot" = false
      AND "startedAt" >= ${startDate}::timestamp
      AND "startedAt" <= ${endDate}::timestamp
    GROUP BY DATE_TRUNC('day', "startedAt")
    ORDER BY date ASC
  `;

  // 获取联系我们访问趋势
  const contactData = await prisma.$queryRaw<
    Array<{ date: Date; count: bigint }>
  >`
    SELECT
      DATE_TRUNC('day', "createdAt") as date,
      COUNT(*) as count
    FROM "AnalyticsPageView"
    WHERE "resourceType" = 'contact'
      AND "createdAt" >= ${startDate}::timestamp
      AND "createdAt" <= ${endDate}::timestamp
    GROUP BY DATE_TRUNC('day', "createdAt")
    ORDER BY date ASC
  `;

  // 转换数据格式
  const sessionCounts = sessionData.map((item) => ({
    date: item.date,
    count: Number(item.count),
  }));

  const contactCounts = contactData.map((item) => ({
    date: item.date,
    count: Number(item.count),
  }));

  if (groupBy === "day") {
    return groupByDayTrend(sessionCounts, contactCounts, startDate, endDate);
  } else if (groupBy === "week") {
    return groupByWeekTrend(sessionCounts, contactCounts, startDate, endDate);
  } else {
    return groupByMonthTrend(sessionCounts, contactCounts, startDate, endDate);
  }
}

/**
 * 获取 TOP 10 产品
 */
async function getTopProducts(
  startDate: Date,
  endDate: Date,
): Promise<
  Array<{ id: string; name: string; slug: string; views: number }>
> {
  const raw = await prisma.$queryRaw<
    Array<{ resourceId: string; views: bigint }>
  >`
    SELECT
      "resourceId",
      COUNT(*) as views
    FROM "AnalyticsPageView"
    WHERE "resourceType" = 'product'
      AND "createdAt" >= ${startDate}::timestamp
      AND "createdAt" <= ${endDate}::timestamp
    GROUP BY "resourceId"
    ORDER BY views DESC, "resourceId" ASC
    LIMIT 10
  `;

  // 获取产品详情
  const productIds = raw
    .map((r) => r.resourceId)
    .filter((id): id is string => !!id);

  if (productIds.length === 0) {
    return [];
  }

  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, slug: true },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));

  return raw
    .map((r) => {
      const product = productMap.get(r.resourceId);
      return {
        id: r.resourceId,
        name: product?.name || "已删除的产品",
        slug: product?.slug || "",
        views: Number(r.views),
      };
    })
    .filter((item) => item.slug); // 只返回找到的产品
}

/**
 * 获取 TOP 10 新闻
 */
async function getTopNews(
  startDate: Date,
  endDate: Date,
): Promise<
  Array<{ id: string; title: string; slug: string; views: number }>
> {
  const raw = await prisma.$queryRaw<
    Array<{ resourceId: string; views: bigint }>
  >`
    SELECT
      "resourceId",
      COUNT(*) as views
    FROM "AnalyticsPageView"
    WHERE "resourceType" = 'news'
      AND "createdAt" >= ${startDate}::timestamp
      AND "createdAt" <= ${endDate}::timestamp
    GROUP BY "resourceId"
    ORDER BY views DESC, "resourceId" ASC
    LIMIT 10
  `;

  const newsIds = raw
    .map((r) => r.resourceId)
    .filter((id): id is string => !!id);

  if (newsIds.length === 0) {
    return [];
  }

  const newsList = await prisma.news.findMany({
    where: { id: { in: newsIds } },
    select: { id: true, title: true, slug: true },
  });

  const newsMap = new Map(newsList.map((n) => [n.id, n]));

  return raw
    .map((r) => {
      const news = newsMap.get(r.resourceId);
      return {
        id: r.resourceId,
        title: news?.title || "已删除的新闻",
        slug: news?.slug || "",
        views: Number(r.views),
      };
    })
    .filter((item) => item.slug);
}

/**
 * 获取 TOP 10 解决方案
 */
async function getTopSolutions(
  startDate: Date,
  endDate: Date,
): Promise<
  Array<{ id: string; name: string; slug: string; views: number }>
> {
  const raw = await prisma.$queryRaw<
    Array<{ resourceId: string; views: bigint }>
  >`
    SELECT
      "resourceId",
      COUNT(*) as views
    FROM "AnalyticsPageView"
    WHERE "resourceType" = 'solution'
      AND "createdAt" >= ${startDate}::timestamp
      AND "createdAt" <= ${endDate}::timestamp
    GROUP BY "resourceId"
    ORDER BY views DESC, "resourceId" ASC
    LIMIT 10
  `;

  const solutionIds = raw
    .map((r) => r.resourceId)
    .filter((id): id is string => !!id);

  if (solutionIds.length === 0) {
    return [];
  }

  const solutions = await prisma.solution.findMany({
    where: { id: { in: solutionIds } },
    select: { id: true, title: true, slug: true },
  });

  const solutionMap = new Map(solutions.map((s) => [s.id, s]));

  return raw
    .map((r) => {
      const solution = solutionMap.get(r.resourceId);
      return {
        id: r.resourceId,
        name: solution?.title || "已删除的解决方案",
        slug: solution?.slug || "",
        views: Number(r.views),
      };
    })
    .filter((item) => item.slug);
}

/**
 * 获取 TOP 10 应用案例
 */
async function getTopCases(
  startDate: Date,
  endDate: Date,
): Promise<
  Array<{ id: string; title: string; slug: string; views: number }>
> {
  const raw = await prisma.$queryRaw<
    Array<{ resourceId: string; views: bigint }>
  >`
    SELECT
      "resourceId",
      COUNT(*) as views
    FROM "AnalyticsPageView"
    WHERE "resourceType" = 'case'
      AND "createdAt" >= ${startDate}::timestamp
      AND "createdAt" <= ${endDate}::timestamp
    GROUP BY "resourceId"
    ORDER BY views DESC, "resourceId" ASC
    LIMIT 10
  `;

  const caseIds = raw
    .map((r) => r.resourceId)
    .filter((id): id is string => !!id);

  if (caseIds.length === 0) {
    return [];
  }

  const cases = await prisma.applicationCase.findMany({
    where: { id: { in: caseIds } },
    select: { id: true, title: true, slug: true },
  });

  const caseMap = new Map(cases.map((c) => [c.id, c]));

  return raw
    .map((r) => {
      const appCase = caseMap.get(r.resourceId);
      return {
        id: r.resourceId,
        title: appCase?.title || "已删除的案例",
        slug: appCase?.slug || "",
        views: Number(r.views),
      };
    })
    .filter((item) => item.slug);
}

export async function GET(request: NextRequest) {
  try {
    // 解析查询参数
    const searchParams = request.nextUrl.searchParams;
    const preset = searchParams.get("preset") || "today";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const groupBy = (searchParams.get("groupBy") as "day" | "week" | "month") ||
      "day";

    const { start, end } = getDateRange(preset, startDate || undefined, endDate || undefined);

    // 并行获取所有统计数据
    const [
      websiteVisits,
      contactViews,
      visitTrend,
      topProducts,
      topNews,
      topSolutions,
      topCases,
    ] = await Promise.all([
      getWebsiteVisits(start, end),
      getContactViews(start, end),
      getVisitTrend(start, end, groupBy),
      getTopProducts(start, end),
      getTopNews(start, end),
      getTopSolutions(start, end),
      getTopCases(start, end),
    ]);

    return ok({
      range: {
        start: start.toISOString(),
        end: end.toISOString(),
        groupBy,
        preset,
      },
      websiteVisits,
      contactViews,
      visitTrend,
      topProducts,
      topNews,
      topSolutions,
      topCases,
    });
  } catch (error) {
    return fail(error);
  }
}
