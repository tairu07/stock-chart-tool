'use client';

import { CandlestickChart } from './CandlestickChart';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { AlertCircle } from 'lucide-react';
import type { StockDataResponse, ChartConfig } from '@/lib/types/api';

interface ChartContainerProps {
  data: StockDataResponse | null;
  config: ChartConfig;
  isLoading: boolean;
  error: string | null;
}

export function ChartContainer({ data, config, isLoading, error }: ChartContainerProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border h-full flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-2 text-gray-600">チャートを読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border h-full flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
          <p className="text-red-600 font-medium">エラーが発生しました</p>
          <p className="text-gray-600 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!data || !data.data || data.data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-2 flex items-center justify-center">
            <span className="text-gray-500 text-xl">📊</span>
          </div>
          <p className="text-gray-600">データがありません</p>
          <p className="text-gray-500 text-sm mt-1">銘柄を選択してください</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border h-full">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {data.meta.code} - {data.meta.name}
            </h2>
            <p className="text-sm text-gray-600">
              {data.meta.market} | {config.period.toUpperCase()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">
              最終更新: {new Date(data.meta.updatedAt).toLocaleDateString('ja-JP')}
            </p>
            <p className="text-xs text-gray-500">
              データ件数: {data.data.length}件
            </p>
          </div>
        </div>
      </div>
      
      <div className="p-4 h-[calc(100%-5rem)]">
        <CandlestickChart data={data.data} config={config} />
      </div>
    </div>
  );
}
