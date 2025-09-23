'use client';

import { useState, useEffect, useCallback } from 'react';

interface HistoryEntry {
  code: string;
  name: string;
  viewedAt: string;
  action: string;
  details: any;
}

interface UseStockHistoryResult {
  history: HistoryEntry[];
  isLoading: boolean;
  error: string | null;
  addHistoryEntry: (code: string, action?: string, details?: any) => Promise<void>;
  refreshHistory: () => Promise<void>;
  clearHistory: () => void;
}

export function useStockHistory(): UseStockHistoryResult {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 履歴を取得
  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        limit: '100', // 最新100件
      });

      const response = await fetch(`/api/history?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch history');
      }

      const data = await response.json();
      setHistory(data.data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch history';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 履歴エントリを追加
  const addHistoryEntry = useCallback(async (
    code: string, 
    action: string = 'view', 
    details: any = {}
  ) => {
    try {
      const response = await fetch('/api/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          action,
          details,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add history entry');
      }

      // ローカルの履歴を更新（最新のエントリを先頭に追加）
      const newEntry: HistoryEntry = {
        code,
        name: '', // サーバーから取得される
        viewedAt: new Date().toISOString(),
        action,
        details,
      };

      setHistory(prev => [newEntry, ...prev.slice(0, 99)]); // 最新100件を保持

    } catch (err) {
      console.error('Failed to add history entry:', err);
      // 履歴の記録失敗は致命的ではないので、エラーを投げない
    }
  }, []);

  // 履歴を再取得
  const refreshHistory = useCallback(async () => {
    await fetchHistory();
  }, [fetchHistory]);

  // 履歴をクリア（ローカルのみ）
  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  // 初期データ取得
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    history,
    isLoading,
    error,
    addHistoryEntry,
    refreshHistory,
    clearHistory,
  };
}
