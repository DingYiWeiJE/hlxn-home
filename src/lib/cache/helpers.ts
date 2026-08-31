import { cacheManager } from "./manager";
import { createLogger } from "@/lib/logger";

const logger = createLogger("CacheHelper");

/**
 * 缓存查询结果的辅助函数
 * @param namespace 缓存命名空间
 * @param params 查询参数
 * @param queryFn 查询函数
 * @param ttl 缓存时间（毫秒）
 */
export async function withCache<T>(
  namespace: string,
  params: Record<string, any>,
  queryFn: () => Promise<T>,
  ttl?: number,
): Promise<T> {
  return cacheManager.getOrCreate(namespace, params, async () => {
    logger.info(`[${namespace}] 执行数据库查询`, { namespace });
    const startTime = Date.now();
    const data = await queryFn();
    const duration = Date.now() - startTime;

    logger.info(`[${namespace}] 数据库查询完成`, { namespace, duration: `${duration}ms` });
    return data;
  }, ttl);
}

/**
 * 清除特定类型的所有缓存
 * @param namespace 命名空间
 */
export function clearCacheByNamespace(namespace: string): number {
  const count = cacheManager.deleteByNamespace(namespace);
  logger.info(`[${namespace}] 清除命名空间缓存完成`, { namespace, count });
  return count;
}

/**
 * 清除特定查询的缓存
 * @param namespace 命名空间
 * @param params 查询参数
 */
export function clearCache(namespace: string, params?: Record<string, any>): boolean {
  const result = cacheManager.delete(namespace, params);
  logger.info(`[${namespace}] 清除缓存`, { namespace, success: result });
  return result;
}

/**
 * 清除所有缓存
 */
export function clearAllCache(): void {
  logger.info("清除所有缓存");
  cacheManager.clear();
}

export default {
  withCache,
  clearCacheByNamespace,
  clearCache,
  clearAllCache,
};
