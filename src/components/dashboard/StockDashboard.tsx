'use client';

import { useState, useEffect } from 'react';
import { ChartContainer } from '@/components/chart/ChartContainer';
import { ControlPanel } from '@/components/controls/ControlPanel';
import { StockInfo } from '@/components/info/StockInfo';
import { NavigationControls } from '@/components/controls/NavigationControls';
import { useStockNavigation } from '@/hooks/useStockNavigation';
import { useStockData } from '@/hooks/useStockData';
import { useStockMarks } from '@/hooks/useStockMarks';
import { useStockHistory } from '@/hooks/useStockHistory';
import { useStockPrefetch } from '@/hooks/useStockPrefetch';
import { CacheStats } from '@/components/debug/CacheStats';
import type { Period, Market, ChartConfig } from '@/lib/types/api';

export function StockDashboard() {
  const [chartConfig, setChartConfig] = useState<ChartConfig>({
    period: '1y',
    logScale: false,
    theme: 'traditional',
  });

  const [market, setMarket] = useState<Market>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const {
    currentIndex,
    totalCount,
    isPlaying,
    speed,
    filteredCodes,
    currentCode,
    goToNext,
    goToPrevious,
    togglePlayback,
    setSpeed,
    updateFilters,
  } = useStockNavigation({ market, searchQuery });

  // マーク機能
  const {
    addMark,
    removeMark,
    isMarked,
  } = useStockMarks();

  // 履歴機能
  const { addHistoryEntry } = useStockHistory();

  // プリフェッチ機能（キャッシュ統計用）
  const { getCacheStats, cleanupCache } = useStockPrefetch({
    codes: filteredCodes,
    currentIndex,
    period: chartConfig.period,
    isPlaying,
  });

  const {
    data: stockData,
    isLoading,
    error,
  } = useStockData(currentCode, chartConfig.period, {
    codes: filteredCodes,
    currentIndex,
    isPlaying,
  });

  // フィルタが変更されたときに銘柄リストを更新
  useEffect(() => {
    updateFilters({ market, searchQuery });
  }, [market, searchQuery, updateFilters]);

  // 銘柄が変更されたときに履歴に記録
  useEffect(() => {
    if (currentCode) {
      addHistoryEntry(currentCode, 'view', {
        period: chartConfig.period,
        market,
        timestamp: new Date().toISOString(),
      });
    }
  }, [currentCode, chartConfig.period, market, addHistoryEntry]);

  // マーク操作のハンドラ
  const handleToggleStar = async () => {
    if (!currentCode) return;
    
    try {
      if (isMarked(currentCode, 'star')) {
        await removeMark(currentCode, 'star');
      } else {
        await addMark(currentCode, 'star');
      }
    } catch (error) {
      console.error('Failed to toggle star:', error);
    }
  };

  const handleToggleSkip = async () => {
    if (!currentCode) return;
    
    try {
      if (isMarked(currentCode, 'skip')) {
        await removeMark(currentCode, 'skip');
      } else {
        await addMark(currentCode, 'skip');
        // スキップした場合は次の銘柄に移動
        goToNext();
      }
    } catch (error) {
      console.error('Failed to toggle skip:', error);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-8rem)]">
      {/* 左サイドバー: コントロールパネル */}
      <div className="lg:col-span-1 space-y-4">
        <ControlPanel
          chartConfig={chartConfig}
          onChartConfigChange={setChartConfig}
          market={market}
          onMarketChange={setMarket}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
        />
        
        <NavigationControls
          currentIndex={currentIndex}
          totalCount={totalCount}
          isPlaying={isPlaying}
          speed={speed}
          onNext={goToNext}
          onPrevious={goToPrevious}
          onTogglePlayback={togglePlayback}
          onSpeedChange={setSpeed}
        />
      </div>

      {/* メインエリア: チャート */}
      <div className="lg:col-span-2">
        <ChartContainer
          data={stockData}
          config={chartConfig}
          isLoading={isLoading}
          error={error}
        />
      </div>

      {/* 右サイドバー: 銘柄情報 */}
      <div className="lg:col-span-1">
        <StockInfo
          code={currentCode}
          data={stockData}
          isLoading={isLoading}
          isStarred={currentCode ? isMarked(currentCode, 'star') : false}
          isSkipped={currentCode ? isMarked(currentCode, 'skip') : false}
          onToggleStar={handleToggleStar}
          onToggleSkip={handleToggleSkip}
        />
      </div>

      {/* キャッシュ統計（デバッグ用） */}
      <CacheStats 
        getCacheStats={getCacheStats}
        onCleanup={cleanupCache}
      />
    </div>
  );
}
