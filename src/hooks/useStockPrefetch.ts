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
  prefetchCount = 5, // プリフェッチ数を増加
}: UseStockPrefetchProps) {
  const cacheRef = useRef<PrefetchCache>({});
  const prefetchingRef = useRef<Set<string>>(new Set());
  const abortControllerRef = useRef<AbortController | null>(null);

  // キャッシュキーを生成
  const getCacheKey = useCallback((code: string, period: Period) => {
    return `${code}-${period}`;
  }, []);

  // キャッシュの有効性をチェック（5分間有効）
  const isCacheValid = useCallback((timestamp: number) => {
    return Date.now() - timestamp < 5 * 60 * 1000; // 5分
  }, []);

  // データをプリフェッチ
  const prefetchData = useCallback(async (code: string, period: Period, signal?: AbortSignal) => {
    const cacheKey = getCacheKey(code, period);
    
    // 既にキャッシュされていて有効な場合はスキップ
    const cached = cacheRef.current[cacheKey];
    if (cached && isCacheValid(cached.timestamp) && cached.period === period) {
      return;
    }

    // 既にプリフェッチ中の場合はスキップ
    if (prefetchingRef.current.has(cacheKey)) {
      return;
    }

    prefetchingRef.current.add(cacheKey);

    try {
      const response = await fetch(`/api/stock/${code}?period=${period}`, {
        signal,
        headers: {
          'Cache-Control': 'max-age=300', // 5分間キャッシュ
        },
      });

      if (signal?.aborted) {
        return;
      }

      if (!response.ok) {
        console.warn(`Failed to prefetch ${code}: ${response.status}`);
        return;
      }

      const data = await response.json();
      
      if (signal?.aborted) {
        return;
      }

      // キャッシュに保存
      cacheRef.current[cacheKey] = {
        data,
        timestamp: Date.now(),
        period,
      };

      console.log(`Prefetched data for ${code} (${period})`);
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.warn(`Error prefetching ${code}:`, error);
      }
    } finally {
      prefetchingRef.current.delete(cacheKey);
    }
  }, [getCacheKey, isCacheValid]);

  // バッチプリフェッチ（複数の銘柄を並行して取得）
  const batchPrefetch = useCallback(async (targetCodes: string[], period: Period) => {
    // 前回のリクエストをキャンセル
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // 並行してプリフェッチ（最大3つまで同時実行）
    const batchSize = 3;
    for (let i = 0; i < targetCodes.length; i += batchSize) {
      const batch = targetCodes.slice(i, i + batchSize);
      const promises = batch.map(code => 
        prefetchData(code, period, abortController.signal)
      );
      
      try {
        await Promise.allSettled(promises);
      } catch (error) {
        // エラーは個別に処理されるため、ここでは無視
      }

      // 少し待機してサーバー負荷を軽減
      if (i + batchSize < targetCodes.length && !abortController.signal.aborted) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }, [prefetchData]);

  // キャッシュからデータを取得
  const getCachedData = useCallback((code: string, period: Period): StockDataResponse | null => {
    const cacheKey = getCacheKey(code, period);
    const cached = cacheRef.current[cacheKey];
    
    if (cached && isCacheValid(cached.timestamp) && cached.period === period) {
      return cached.data;
    }
    
    return null;
  }, [getCacheKey, isCacheValid]);

  // プリフェッチ対象の銘柄を決定
  const getTargetCodes = useCallback(() => {
    if (codes.length === 0) return [];

    const targets: string[] = [];
    
    // 現在の銘柄の前後をプリフェッチ
    for (let i = -2; i <= prefetchCount; i++) {
      const index = (currentIndex + i + codes.length) % codes.length;
      if (index >= 0 && index < codes.length) {
        targets.push(codes[index]);
      }
    }

    return [...new Set(targets)]; // 重複を除去
  }, [codes, currentIndex, prefetchCount]);

  // プリフェッチの実行
  useEffect(() => {
    if (codes.length === 0) return;

    const targetCodes = getTargetCodes();
    
    // 自動再生中は積極的にプリフェッチ
    if (isPlaying) {
      batchPrefetch(targetCodes, period);
    } else {
      // 手動操作時は現在の銘柄周辺のみプリフェッチ
      const limitedTargets = targetCodes.slice(0, 3);
      batchPrefetch(limitedTargets, period);
    }
  }, [codes, currentIndex, period, isPlaying, getTargetCodes, batchPrefetch]);

  // 期間が変更された時に関連するキャッシュをクリア
  useEffect(() => {
    const currentKeys = Object.keys(cacheRef.current);
    currentKeys.forEach(key => {
      const cached = cacheRef.current[key];
      if (cached.period !== period) {
        delete cacheRef.current[key];
      }
    });
  }, [period]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // キャッシュ統計を取得
  const getCacheStats = useCallback(() => {
    const totalEntries = Object.keys(cacheRef.current).length;
    const validEntries = Object.values(cacheRef.current).filter(
      entry => isCacheValid(entry.timestamp) && entry.period === period
    ).length;
    
    return {
      total: totalEntries,
      valid: validEntries,
      hitRate: totalEntries > 0 ? (validEntries / totalEntries * 100).toFixed(1) : '0',
    };
  }, [isCacheValid, period]);

  return {
    getCachedData,
    getCacheStats,
    prefetchData,
  };
}
