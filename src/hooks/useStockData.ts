'use client';

import { useState, useEffect, useCallback } from 'react';
import { useStockPrefetch } from './useStockPrefetch';
import type { StockDataResponse, Period } from '@/lib/types/api';

interface UseStockDataResult {
  data: StockDataResponse | null;
  isLoading: boolean;
  error: string | null;
}

export function useStockData(
  code: string | null, 
  period: Period,
  prefetchOptions?: {
    codes: string[];
    currentIndex: number;
    isPlaying: boolean;
  }
): UseStockDataResult {
  const [data, setData] = useState<StockDataResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // プリフェッチ機能を使用（オプション）
  const { getCachedData } = useStockPrefetch({
    codes: prefetchOptions?.codes || [],
    currentIndex: prefetchOptions?.currentIndex || 0,
    period,
    isPlaying: prefetchOptions?.isPlaying || false,
  });

  const fetchStockData = useCallback(async (stockCode: string, stockPeriod: Period) => {
    // まずキャッシュをチェック
    if (prefetchOptions) {
      const cachedData = getCachedData(stockCode, stockPeriod);
      if (cachedData) {
        setData(cachedData);
        setError(null);
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        period: stockPeriod,
        adjusted: 'true',
        fields: 'ohlcv',
      });

      const response = await fetch(`/api/stock/${stockCode}?${params}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('銘柄が見つかりません');
        }
        throw new Error(`データの取得に失敗しました: ${response.statusText}`);
      }

      const stockData = await response.json();
      setData(stockData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'データの取得に失敗しました';
      setError(errorMessage);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [getCachedData, prefetchOptions]);

  // コードまたは期間が変更されたときにデータを取得
  useEffect(() => {
    if (code) {
      fetchStockData(code, period);
    } else {
      setData(null);
      setError(null);
      setIsLoading(false);
    }
  }, [code, period, fetchStockData]);

  return {
    data,
    isLoading,
    error,
  };
}
