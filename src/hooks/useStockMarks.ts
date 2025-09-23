'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Mark } from '@/lib/types/api';

interface UseStockMarksResult {
  marks: Mark[];
  isLoading: boolean;
  error: string | null;
  addMark: (code: string, kind: 'star' | 'skip' | 'tag' | 'note', payload?: string) => Promise<void>;
  removeMark: (code: string, kind: 'star' | 'skip' | 'tag' | 'note') => Promise<void>;
  isMarked: (code: string, kind: 'star' | 'skip' | 'tag' | 'note') => boolean;
  getMarksByCode: (code: string) => Mark[];
  refreshMarks: () => Promise<void>;
}

export function useStockMarks(): UseStockMarksResult {
  const [marks, setMarks] = useState<Mark[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // マークを取得
  const fetchMarks = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/marks');
      if (!response.ok) {
        throw new Error('Failed to fetch marks');
      }

      const data = await response.json();
      setMarks(data.data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch marks';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // マークを追加
  const addMark = useCallback(async (
    code: string, 
    kind: 'star' | 'skip' | 'tag' | 'note', 
    payload?: string
  ) => {
    try {
      const response = await fetch('/api/marks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          kind,
          payload,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add mark');
      }

      const newMark = await response.json();
      
      // 既存のマークを更新（star/skipは重複不可）
      if (kind === 'star' || kind === 'skip') {
        setMarks(prev => [
          ...prev.filter(m => !(m.code === code && m.kind === kind)),
          newMark,
        ]);
      } else {
        setMarks(prev => [...prev, newMark]);
      }

      // 履歴にも記録
      await fetch('/api/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          action: 'mark',
          details: { markKind: kind, payload },
        }),
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add mark';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // マークを削除
  const removeMark = useCallback(async (
    code: string, 
    kind: 'star' | 'skip' | 'tag' | 'note'
  ) => {
    try {
      const params = new URLSearchParams({ code, kind });
      const response = await fetch(`/api/marks?${params}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove mark');
      }

      setMarks(prev => prev.filter(m => !(m.code === code && m.kind === kind)));

      // 履歴にも記録
      await fetch('/api/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          action: 'unmark',
          details: { markKind: kind },
        }),
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove mark';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // 特定の銘柄がマークされているかチェック
  const isMarked = useCallback((code: string, kind: 'star' | 'skip' | 'tag' | 'note') => {
    return marks.some(mark => mark.code === code && mark.kind === kind);
  }, [marks]);

  // 特定の銘柄のマークを取得
  const getMarksByCode = useCallback((code: string) => {
    return marks.filter(mark => mark.code === code);
  }, [marks]);

  // マークを再取得
  const refreshMarks = useCallback(async () => {
    await fetchMarks();
  }, [fetchMarks]);

  // 初期データ取得
  useEffect(() => {
    fetchMarks();
  }, [fetchMarks]);

  return {
    marks,
    isLoading,
    error,
    addMark,
    removeMark,
    isMarked,
    getMarksByCode,
    refreshMarks,
  };
}
