// プリフェッチ機能のユーティリティ

import type { Period, PlaybackSpeed } from '../types/api';

export interface PrefetchConfig {
  speed: PlaybackSpeed;
  prefetchCount: number;
  maxConcurrent: number;
}

// 巡回速度に応じたプリフェッチ設定
export function getPrefetchConfig(speed: PlaybackSpeed): PrefetchConfig {
  switch (speed) {
    case 1:
      return { speed, prefetchCount: 5, maxConcurrent: 3 };
    case 2:
      return { speed, prefetchCount: 4, maxConcurrent: 3 };
    case 3:
      return { speed, prefetchCount: 3, maxConcurrent: 2 };
    case 5:
      return { speed, prefetchCount: 2, maxConcurrent: 2 };
    case 10:
      return { speed, prefetchCount: 1, maxConcurrent: 1 };
    default:
      return { speed, prefetchCount: 3, maxConcurrent: 2 };
  }
}

export class PrefetchManager {
  private cache = new Map<string, Promise<any>>();
  private config: PrefetchConfig;
  
  constructor(speed: PlaybackSpeed) {
    this.config = getPrefetchConfig(speed);
  }
  
  updateSpeed(speed: PlaybackSpeed) {
    this.config = getPrefetchConfig(speed);
  }
  
  private getCacheKey(code: string, period: Period): string {
    return `${code}:${period}`;
  }
  
  async prefetch(
    codes: string[],
    currentIndex: number,
    period: Period,
    fetcher: (code: string, period: Period) => Promise<any>
  ): Promise<void> {
    const { prefetchCount, maxConcurrent } = this.config;
    
    // 次のN個の銘柄を特定
    const nextCodes = codes.slice(
      currentIndex + 1,
      currentIndex + 1 + prefetchCount
    );
    
    // 並行実行数を制限してプリフェッチ
    const semaphore = new Semaphore(maxConcurrent);
    
    const prefetchPromises = nextCodes.map(async (code) => {
      const cacheKey = this.getCacheKey(code, period);
      
      if (!this.cache.has(cacheKey)) {
        const promise = semaphore.acquire().then(async (release) => {
          try {
            return await fetcher(code, period);
          } finally {
            release();
          }
        });
        
        this.cache.set(cacheKey, promise);
      }
      
      return this.cache.get(cacheKey);
    });
    
    // すべてのプリフェッチを並行実行（エラーは無視）
    await Promise.allSettled(prefetchPromises);
  }
  
  async get(code: string, period: Period): Promise<any | null> {
    const cacheKey = this.getCacheKey(code, period);
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      try {
        return await cached;
      } catch (error) {
        // キャッシュからエラーのあるエントリを削除
        this.cache.delete(cacheKey);
        return null;
      }
    }
    
    return null;
  }
  
  clear() {
    this.cache.clear();
  }
  
  clearOld(keepCount: number = 10) {
    if (this.cache.size <= keepCount) return;
    
    const entries = Array.from(this.cache.entries());
    const toDelete = entries.slice(0, entries.length - keepCount);
    
    toDelete.forEach(([key]) => {
      this.cache.delete(key);
    });
  }
}

class Semaphore {
  private permits: number;
  private queue: Array<() => void> = [];
  
  constructor(permits: number) {
    this.permits = permits;
  }
  
  async acquire(): Promise<() => void> {
    return new Promise((resolve) => {
      if (this.permits > 0) {
        this.permits--;
        resolve(() => this.release());
      } else {
        this.queue.push(() => {
          this.permits--;
          resolve(() => this.release());
        });
      }
    });
  }
  
  private release() {
    this.permits++;
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      if (next) next();
    }
  }
}
