'use client';

import { Search, Settings } from 'lucide-react';
import type { ChartConfig, Period, Market } from '@/lib/types/api';

interface ControlPanelProps {
  chartConfig: ChartConfig;
  onChartConfigChange: (config: ChartConfig) => void;
  market: Market;
  onMarketChange: (market: Market) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
}

export function ControlPanel({
  chartConfig,
  onChartConfigChange,
  market,
  onMarketChange,
  searchQuery,
  onSearchQueryChange,
}: ControlPanelProps) {
  const periods: { value: Period; label: string }[] = [
    { value: '1m', label: '1ヶ月' },
    { value: '3m', label: '3ヶ月' },
    { value: '1y', label: '1年' },
    { value: '3y', label: '3年' },
    { value: '5y', label: '5年' },
  ];

  const markets: { value: Market; label: string }[] = [
    { value: 'ALL', label: '全市場' },
    { value: 'PRIME', label: 'プライム' },
    { value: 'STANDARD', label: 'スタンダード' },
    { value: 'GROWTH', label: 'グロース' },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 space-y-4">
      <div className="flex items-center space-x-2">
        <Settings className="w-5 h-5 text-gray-600" />
        <h2 className="text-lg font-semibold text-gray-900">コントロール</h2>
      </div>

      {/* 検索 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          銘柄検索
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="銘柄コードまたは名称"
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* 市場フィルタ */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          市場
        </label>
        <select
          value={market}
          onChange={(e) => onMarketChange(e.target.value as Market)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {markets.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      {/* 期間選択 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          表示期間
        </label>
        <div className="grid grid-cols-2 gap-2">
          {periods.map((period) => (
            <button
              key={period.value}
              onClick={() =>
                onChartConfigChange({ ...chartConfig, period: period.value })
              }
              className={`px-3 py-2 text-sm rounded-md transition-colors ${
                chartConfig.period === period.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* チャート設定 */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700">チャート設定</h3>
        
        {/* 対数スケール */}
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={chartConfig.logScale}
            onChange={(e) =>
              onChartConfigChange({ ...chartConfig, logScale: e.target.checked })
            }
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-700">対数スケール</span>
        </label>

        {/* テーマ選択 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            カラーテーマ
          </label>
          <select
            value={chartConfig.theme}
            onChange={(e) =>
              onChartConfigChange({
                ...chartConfig,
                theme: e.target.value as 'traditional' | 'modern',
              })
            }
            className="w-full px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="traditional">伝統的（上昇=赤/下落=青）</option>
            <option value="modern">モダン（上昇=緑/下落=赤）</option>
          </select>
        </div>
      </div>

      {/* ショートカットヘルプ */}
      <div className="pt-4 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-2">ショートカット</h3>
        <div className="text-xs text-gray-600 space-y-1">
          <div>Space: 再生/停止</div>
          <div>←/→: 前/次の銘柄</div>
          <div>1-5: 期間切替</div>
          <div>1,2,3,5,0: 速度変更</div>
        </div>
      </div>
    </div>
  );
}
