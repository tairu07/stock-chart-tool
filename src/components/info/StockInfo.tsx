'use client';

import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, Info, Star, X } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { StockDataResponse } from '@/lib/types/api';

interface StockInfoProps {
  code: string | null;
  data: StockDataResponse | null;
  isLoading: boolean;
  isStarred?: boolean;
  isSkipped?: boolean;
  onToggleStar?: () => void;
  onToggleSkip?: () => void;
}

export function StockInfo({ 
  code, 
  data, 
  isLoading, 
  isStarred = false, 
  isSkipped = false, 
  onToggleStar, 
  onToggleSkip 
}: StockInfoProps) {
  const stockStats = useMemo(() => {
    if (!data || !data.data || data.data.length === 0) return null;

    const prices = data.data;
    const latest = prices[prices.length - 1];
    const previous = prices.length > 1 ? prices[prices.length - 2] : latest;
    
    const change = latest.c - previous.c;
    const changePercent = previous.c > 0 ? (change / previous.c) * 100 : 0;
    
    // 期間内の高値・安値
    const highs = prices.map(p => p.h);
    const lows = prices.map(p => p.l);
    const volumes = prices.map(p => p.v);
    
    const periodHigh = Math.max(...highs);
    const periodLow = Math.min(...lows);
    const avgVolume = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
    
    return {
      current: latest.c,
      change,
      changePercent,
      open: latest.o,
      high: latest.h,
      low: latest.l,
      volume: latest.v,
      periodHigh,
      periodLow,
      avgVolume,
      dataPoints: prices.length,
    };
  }, [data]);

  if (!code) {
    return (
      <div className="bg-white rounded-lg shadow-sm border h-full p-4">
        <div className="flex items-center space-x-2 mb-4">
          <Info className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">銘柄情報</h2>
        </div>
        <div className="text-center text-gray-500 mt-8">
          銘柄を選択してください
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border h-full p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Info className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">銘柄情報</h2>
        </div>
        
        {/* アクションボタン */}
        <div className="flex space-x-1">
          <button
            onClick={onToggleStar}
            className={`p-1 rounded transition-colors ${
              isStarred 
                ? 'bg-yellow-100 text-yellow-600' 
                : 'hover:bg-yellow-100 text-gray-400 hover:text-yellow-600'
            }`}
            title={isStarred ? 'お気に入りから削除' : 'お気に入りに追加'}
          >
            <Star className={`w-4 h-4 ${isStarred ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={onToggleSkip}
            className={`p-1 rounded transition-colors ${
              isSkipped 
                ? 'bg-red-100 text-red-600' 
                : 'hover:bg-red-100 text-gray-400 hover:text-red-600'
            }`}
            title={isSkipped ? 'スキップを解除' : 'スキップ'}
          >
            <X className={`w-4 h-4 ${isSkipped ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : !data ? (
        <div className="text-center text-gray-500 py-8">
          データがありません
        </div>
      ) : (
        <div className="space-y-4">
          {/* 基本情報 */}
          <div>
            <h3 className="text-xl font-bold text-gray-900">{data.meta.code}</h3>
            <p className="text-gray-600">{data.meta.name}</p>
            <p className="text-sm text-gray-500">{data.meta.market}</p>
          </div>

          {stockStats && (
            <>
              {/* 現在価格と変化 */}
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-gray-900">
                  ¥{stockStats.current.toLocaleString()}
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  {stockStats.change > 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  ) : stockStats.change < 0 ? (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  ) : (
                    <Minus className="w-4 h-4 text-gray-600" />
                  )}
                  <span
                    className={`font-medium ${
                      stockStats.change > 0
                        ? 'text-green-600'
                        : stockStats.change < 0
                        ? 'text-red-600'
                        : 'text-gray-600'
                    }`}
                  >
                    {stockStats.change > 0 ? '+' : ''}
                    {stockStats.change.toFixed(2)} (
                    {stockStats.changePercent > 0 ? '+' : ''}
                    {stockStats.changePercent.toFixed(2)}%)
                  </span>
                </div>
              </div>

              {/* 当日の四本値 */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">当日の値動き</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">始値</span>
                    <div className="font-medium">¥{stockStats.open.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">高値</span>
                    <div className="font-medium text-red-600">¥{stockStats.high.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">安値</span>
                    <div className="font-medium text-blue-600">¥{stockStats.low.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">出来高</span>
                    <div className="font-medium">{stockStats.volume.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              {/* 期間統計 */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">期間統計</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">期間高値</span>
                    <span className="font-medium text-red-600">
                      ¥{stockStats.periodHigh.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">期間安値</span>
                    <span className="font-medium text-blue-600">
                      ¥{stockStats.periodLow.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">平均出来高</span>
                    <span className="font-medium">
                      {Math.round(stockStats.avgVolume).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">データ件数</span>
                    <span className="font-medium">{stockStats.dataPoints}日</span>
                  </div>
                </div>
              </div>

              {/* 価格レンジ */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">価格レンジ</h4>
                <div className="relative">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${
                          ((stockStats.current - stockStats.periodLow) /
                            (stockStats.periodHigh - stockStats.periodLow)) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-600 mt-1">
                    <span>¥{stockStats.periodLow.toLocaleString()}</span>
                    <span>¥{stockStats.periodHigh.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* 最終更新 */}
          <div className="pt-3 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              最終更新: {new Date(data.meta.updatedAt).toLocaleString('ja-JP')}
            </div>
            <div className="text-xs text-gray-500">
              データセット: {data.meta.datasetId}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
