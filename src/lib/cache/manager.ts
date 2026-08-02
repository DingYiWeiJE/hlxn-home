import { createLogger } from "@/lib/logger";

interface CacheItem<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheConfig {
  ttl?: number; // 默认 TTL（毫秒）
}

const logger = createLogger("CacheManager");

class CacheManager {
  private cache: Map<string, CacheItem> = new Map();
  private defaultTTL: number;

  constructor(config: CacheConfig = {}) {
    this.defaultTTL = config.ttl || 10 * 60 * 1000; // 默认 10 分钟
  }

  /**
   * 生成缓存键
   * @param namespace 命名空间 (e.g., 'solutions', 'products')
   * @param params 参数对象，自动序列化为字符串
   */
  private generateKey(namespace: string, params?: Record<string, any>): string {
    if (!params || Object.keys(params).length === 0) {
      return namespace;
    }
    const sortedParams = Object.keys(params)
      .sort()
      .map((key) => `${key}=${JSON.stringify(params[key])}`)
      .join('&');
    return `${namespace}:${sortedParams}`;
  }

  /**
   * 获取缓存
   */
  get<T = any>(namespace: string, params?: Record<string, any>): T | null {
    const key = this.generateKey(namespace, params);
    const item = this.cache.get(key);

    if (!item) {
      logger.info("缓存未命中", { namespace, key });
      return null;
    }

    // 检查是否过期
    const isExpired = Date.now() - item.timestamp > item.ttl;
    if (isExpired) {
      logger.info("缓存已过期，删除", { namespace, key });
      this.cache.delete(key);
      return null;
    }

    const ttlRemaining = item.ttl - (Date.now() - item.timestamp);
    logger.info("缓存命中", {
      namespace,
      key,
      ttlRemaining: `${Math.round(ttlRemaining / 1000)}s`,
      cacheSize: this.cache.size,
    });
    return item.data as T;
  }

  /**
   * 设置缓存
   */
  set<T = any>(
    namespace: string,
    data: T,
    params?: Record<string, any>,
    ttl?: number,
  ): void {
    const key = this.generateKey(namespace, params);
    const effectiveTTL = ttl || this.defaultTTL;

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: effectiveTTL,
    });

    logger.info("缓存已设置", {
      namespace,
      key,
      ttl: `${effectiveTTL / 1000}s`,
      cacheSize: this.cache.size,
    });
  }

  /**
   * 删除单个缓存
   */
  delete(namespace: string, params?: Record<string, any>): boolean {
    const key = this.generateKey(namespace, params);
    const exists = this.cache.has(key);
    const result = this.cache.delete(key);

    logger.info("删除缓存", {
      namespace,
      key,
      existed: exists,
      cacheSize: this.cache.size,
    });

    return result;
  }

  /**
   * 删除某个命名空间的所有缓存
   * @param namespace 命名空间前缀
   */
  deleteByNamespace(namespace: string): number {
    const prefix = `${namespace}:`;
    let count = 0;
    const keys: string[] = [];

    for (const key of this.cache.keys()) {
      if (key === namespace || key.startsWith(prefix)) {
        keys.push(key);
        this.cache.delete(key);
        count++;
      }
    }

    logger.info("删除命名空间缓存", {
      namespace,
      count,
      deletedKeys: keys,
      cacheSize: this.cache.size,
    });

    return count;
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    const count = this.cache.size;
    this.cache.clear();
    logger.info("清空所有缓存", { count });
  }

  /**
   * 获取缓存统计信息（用于调试）
   */
  getStats(): {
    size: number;
    keys: string[];
  } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// 创建单例实例
export const cacheManager = new CacheManager();

export default cacheManager;

