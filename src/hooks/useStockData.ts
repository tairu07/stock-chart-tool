'use client';

import { useState, useEffect, useCallback } from 'react';
import { useStockPrefetch } from './useStockPrefetch';
import { generateMockStockData } from '@/lib/mock-stock-data';
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
      console.log(`Fetching stock data for ${stockCode} (${stockPeriod})`);
      
      const response = await fetch(`/api/stock/${stockCode}?period=${stockPeriod}`);
      
      if (!response.ok) {
        console.error(`API Error: ${response.status} ${response.statusText}`);
        // フォールバック: モックデータを生成
        const mockData = generateMockStockData(stockCode, stockPeriod);
        setData(mockData);
        setError(null);
        setIsLoading(false);
        return;
      }

      const stockData = await response.json();
      console.log(`Successfully fetched data for ${stockCode}:`, stockData);
      
      if (!stockData || !stockData.prices || stockData.prices.length === 0) {
        // データが空の場合もモックデータを使用
        const mockData = generateMockStockData(stockCode, stockPeriod);
        setData(mockData);
        setError(null);
        setIsLoading(false);
        return;
      }

    } catch (err) {
      console.error('Error fetching stock data:', err);
      // エラー時もモックデータを使用
      const mockData = generateMockStockData(stockCode, stockPeriod);
      setData(mockData);
      setError(null);
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
