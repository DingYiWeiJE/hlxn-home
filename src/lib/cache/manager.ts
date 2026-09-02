import { createLogger } from "@/lib/logger";

interface CacheItem<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheConfig {
  ttl?: number; // 默认 TTL（毫秒）
  maxSize?: number; // 最大缓存条目数，超出后按最久未使用淘汰
}

const logger = createLogger("CacheManager");

// 数据主要靠写操作时主动清除缓存来保证一致性，
// 这里的 TTL 只是兜底：防止漏写的失效逻辑或绕过应用层的直接改库
// 导致脏数据永久停留在内存里。
const DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 小时
const DEFAULT_MAX_SIZE = 500;

class CacheManager {
  private cache: Map<string, CacheItem> = new Map();
  private pending: Map<string, Promise<any>> = new Map();
  private defaultTTL: number;
  private maxSize: number;

  constructor(config: CacheConfig = {}) {
    this.defaultTTL = config.ttl || DEFAULT_TTL;
    this.maxSize = config.maxSize || DEFAULT_MAX_SIZE;
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

    // 命中后重新插入，把该条目移到 Map 末尾，标记为最近使用（LRU）
    this.cache.delete(key);
    this.cache.set(key, item);

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

    // 超出容量上限时，淘汰最久未使用的条目（Map 头部）
    while (this.cache.size > this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey === undefined) break;
      this.cache.delete(oldestKey);
      logger.info("缓存已满，淘汰最久未使用条目", {
        evictedKey: oldestKey,
        maxSize: this.maxSize,
      });
    }

    logger.info("缓存已设置", {
      namespace,
      key,
      ttl: `${effectiveTTL / 1000}s`,
      cacheSize: this.cache.size,
    });
  }

  /**
   * 获取缓存，未命中时执行查询并写入缓存。
   * 并发的相同请求会共享同一个进行中的查询 Promise，避免在查询期间
   * 数据被并发写入（如后台管理编辑）导致同一响应内出现不一致的快照。
   */
  async getOrCreate<T = any>(
    namespace: string,
    params: Record<string, any> | undefined,
    queryFn: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    const cached = this.get<T>(namespace, params);
    if (cached !== null) {
      return cached;
    }

    const key = this.generateKey(namespace, params);
    const inFlight = this.pending.get(key);
    if (inFlight) {
      logger.info("等待进行中的查询", { namespace, key });
      return inFlight as Promise<T>;
    }

    const promise = (async () => {
      try {
        const data = await queryFn();
        this.set(namespace, data, params, ttl);
        return data;
      } finally {
        this.pending.delete(key);
      }
    })();

    this.pending.set(key, promise);
    return promise;
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

