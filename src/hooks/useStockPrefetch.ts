'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { Period, StockDataResponse } from '@/lib/types/api';

interface PrefetchCache {
  [key: string]: {
    data: StockDataResponse;
    timestamp: number;
    period: Period;
  };
}

interface UseStockPrefetchProps {
  codes: string[];
  currentIndex: number;
  period: Period;
  isPlaying: boolean;
  prefetchCount?: number;
}

export function useStockPrefetch({
  codes,
  currentIndex,
  period,
  isPlaying,
  prefetchCount = 3,
}: UseStockPrefetchProps) {
  const cacheRef = useRef<PrefetchCache>({});
  const prefetchingRef = useRef<Set<string>>(new Set());

  // キャッシュキーを生成
  const getCacheKey = useCallback((code: string, period: Period) => {
    return `${code}-${period}`;
  }, []);

  // データをプリフェッチ
  const prefetchData = useCallback(async (code: string, period: Period) => {
    const cacheKey = getCacheKey(code, period);
    
    // 既にキャッシュされているかプリフェッチ中の場合はスキップ
    if (cacheRef.current[cacheKey] || prefetchingRef.current.has(cacheKey)) {
      return;
    }

    prefetchingRef.current.add(cacheKey);

    try {
      const params = new URLSearchParams({
        period,
        adjusted: 'true',
        fields: 'ohlcv',
      });

      const response = await fetch(`/api/stock/${code}?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        
        // キャッシュに保存（5分間有効）
        cacheRef.current[cacheKey] = {
          data,
          timestamp: Date.now(),
          period,
        };

        console.log(`Prefetched data for ${code} (${period})`);
      }
    } catch (error) {
      console.error(`Failed to prefetch data for ${code}:`, error);
    } finally {
      prefetchingRef.current.delete(cacheKey);
    }
  }, [getCacheKey]);

  // キャッシュからデータを取得
  const getCachedData = useCallback((code: string, period: Period): StockDataResponse | null => {
    const cacheKey = getCacheKey(code, period);
    const cached = cacheRef.current[cacheKey];
    
    if (!cached) return null;
    
    // 5分以上古いキャッシュは無効
    const isExpired = Date.now() - cached.timestamp > 5 * 60 * 1000;
    if (isExpired) {
      delete cacheRef.current[cacheKey];
      return null;
    }
    
    return cached.data;
  }, [getCacheKey]);

  // 古いキャッシュをクリーンアップ
  const cleanupCache = useCallback(() => {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    Object.entries(cacheRef.current).forEach(([key, cached]) => {
      if (now - cached.timestamp > 5 * 60 * 1000) {
        expiredKeys.push(key);
      }
    });
    
    expiredKeys.forEach(key => {
      delete cacheRef.current[key];
    });
    
    if (expiredKeys.length > 0) {
      console.log(`Cleaned up ${expiredKeys.length} expired cache entries`);
    }
  }, []);

  // プリフェッチを実行
  useEffect(() => {
    if (codes.length === 0) return;

    // 現在の銘柄の前後をプリフェッチ
    const indicesToPrefetch: number[] = [];
    
    // 次の銘柄をプリフェッチ
    for (let i = 1; i <= prefetchCount; i++) {
      const nextIndex = (currentIndex + i) % codes.length;
      indicesToPrefetch.push(nextIndex);
    }
    
    // 再生中でない場合は前の銘柄もプリフェッチ
    if (!isPlaying) {
      for (let i = 1; i <= Math.min(prefetchCount, 2); i++) {
        const prevIndex = currentIndex - i < 0 
          ? codes.length + (currentIndex - i) 
          : currentIndex - i;
        indicesToPrefetch.push(prevIndex);
      }
    }

    // 重複を除去してプリフェッチ実行
    const uniqueIndices = [...new Set(indicesToPrefetch)];
    uniqueIndices.forEach(index => {
      const code = codes[index];
      if (code) {
        prefetchData(code, period);
      }
    });

    // 定期的にキャッシュをクリーンアップ
    const cleanupInterval = setInterval(cleanupCache, 60000); // 1分ごと

    return () => {
      clearInterval(cleanupInterval);
    };
  }, [codes, currentIndex, period, isPlaying, prefetchCount, prefetchData, cleanupCache]);

  // キャッシュ統計を取得
  const getCacheStats = useCallback(() => {
    const entries = Object.entries(cacheRef.current);
    const now = Date.now();
    
    return {
      total: entries.length,
      valid: entries.filter(([, cached]) => now - cached.timestamp <= 5 * 60 * 1000).length,
      expired: entries.filter(([, cached]) => now - cached.timestamp > 5 * 60 * 1000).length,
      prefetching: prefetchingRef.current.size,
    };
  }, []);

  return {
    getCachedData,
    getCacheStats,
    cleanupCache,
  };
}
