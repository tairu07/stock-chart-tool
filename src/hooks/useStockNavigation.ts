'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Market, PlaybackSpeed } from '@/lib/types/api';

interface UseStockNavigationProps {
  market: Market;
  searchQuery: string;
}

interface NavigationState {
  currentIndex: number;
  totalCount: number;
  isPlaying: boolean;
  speed: PlaybackSpeed;
  filteredCodes: string[];
  currentCode: string | null;
}

export function useStockNavigation({ market, searchQuery }: UseStockNavigationProps) {
  const [state, setState] = useState<NavigationState>({
    currentIndex: 0,
    totalCount: 0,
    isPlaying: false,
    speed: 3,
    filteredCodes: [],
    currentCode: null,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 銘柄リストを取得（全銘柄対応）
  const fetchStockList = useCallback(async () => {
    try {
      console.log('Fetching stock list for navigation...');
      
      // 全銘柄を取得するため、大きなlimitを設定
      const params = new URLSearchParams({
        limit: '5000', // J-Quants APIの全銘柄をカバー
        page: '1',
      });

      if (market && market !== 'all') {
        params.append('market', market);
      }

      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(`/api/list?${params}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch stock list: ${response.status}`);
      }

      const data = await response.json();
      console.log(`Fetched ${data.stocks?.length || 0} stocks for navigation`);
      
      const codes = (data.stocks || []).map((stock: any) => stock.code);

      setState(prev => ({
        ...prev,
        filteredCodes: codes,
        totalCount: codes.length,
        currentIndex: Math.min(prev.currentIndex, codes.length - 1),
        currentCode: codes[Math.min(prev.currentIndex, codes.length - 1)] || null,
      }));
    } catch (error) {
      console.error('Error fetching stock list:', error);
    }
  }, [market, searchQuery]);

  // フィルタ更新
  const updateFilters = useCallback((filters: { market: Market; searchQuery: string }) => {
    fetchStockList();
  }, [fetchStockList]);

  // 次の銘柄に移動
  const goToNext = useCallback(() => {
    setState(prev => {
      const nextIndex = (prev.currentIndex + 1) % prev.totalCount;
      return {
        ...prev,
        currentIndex: nextIndex,
        currentCode: prev.filteredCodes[nextIndex] || null,
      };
    });
  }, []);

  // 前の銘柄に移動
  const goToPrevious = useCallback(() => {
    setState(prev => {
      const prevIndex = prev.currentIndex === 0 ? prev.totalCount - 1 : prev.currentIndex - 1;
      return {
        ...prev,
        currentIndex: prevIndex,
        currentCode: prev.filteredCodes[prevIndex] || null,
      };
    });
  }, []);

  // 再生/停止の切り替え
  const togglePlayback = useCallback(() => {
    setState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, []);

  // 速度変更
  const setSpeed = useCallback((newSpeed: PlaybackSpeed) => {
    setState(prev => ({ ...prev, speed: newSpeed }));
  }, []);

  // 特定のインデックスに移動
  const goToIndex = useCallback((index: number) => {
    setState(prev => {
      const clampedIndex = Math.max(0, Math.min(index, prev.totalCount - 1));
      return {
        ...prev,
        currentIndex: clampedIndex,
        currentCode: prev.filteredCodes[clampedIndex] || null,
      };
    });
  }, []);

  // 自動再生の制御
  useEffect(() => {
    if (state.isPlaying && state.totalCount > 0) {
      intervalRef.current = setInterval(() => {
        goToNext();
      }, state.speed * 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.isPlaying, state.speed, state.totalCount, goToNext]);

  // キーボードショートカット
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'Space':
          event.preventDefault();
          togglePlayback();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          goToPrevious();
          break;
        case 'ArrowRight':
          event.preventDefault();
          goToNext();
          break;
        case 'Digit1':
          event.preventDefault();
          setSpeed(1);
          break;
        case 'Digit2':
          event.preventDefault();
          setSpeed(2);
          break;
        case 'Digit3':
          event.preventDefault();
          setSpeed(3);
          break;
        case 'Digit5':
          event.preventDefault();
          setSpeed(5);
          break;
        case 'Digit0':
          event.preventDefault();
          setSpeed(10);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlayback, goToPrevious, goToNext, setSpeed]);

   // 初期化（全銘柄対応）
  useEffect(() => {
    console.log('Initializing stock navigation...');
    fetchStockList();
  }, [fetchStockList]);

  // デバッグ情報
  useEffect(() => {
    console.log(`Navigation state: ${state.currentIndex + 1}/${state.totalCount} stocks, current: ${state.currentCode}`);
  }, [state.currentIndex, state.totalCount, state.currentCode]);

  return {
    currentIndex: state.currentIndex,
    totalCount: state.totalCount,
    isPlaying: state.isPlaying,
    speed: state.speed,
    filteredCodes: state.filteredCodes,
    currentCode: state.currentCode,
    goToNext,
    goToPrevious,
    togglePlayback,
    setSpeed,
    goToIndex,
    updateFilters,
  };
}
