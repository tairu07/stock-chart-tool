'use client';

import { useMemo } from 'react';
import {
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Bar,
  ReferenceLine,
} from 'recharts';
import type { StockPrice, ChartConfig } from '@/lib/types/api';

interface CandlestickChartProps {
  data: StockPrice[];
  config: ChartConfig;
}

interface ChartDataPoint {
  date: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  change: number;
  changePercent: number;
}

// カスタムローソク足コンポーネント
const CandlestickBar = (props: any) => {
  const { payload, x, y, width, height, config } = props;
  
  if (!payload) return null;

  const { open, high, low, close } = payload;
  const isUp = close >= open;
  
  // テーマに基づく色設定
  const colors = config.theme === 'traditional' 
    ? { up: '#dc2626', down: '#2563eb' }  // 上昇=赤, 下落=青
    : { up: '#16a34a', down: '#dc2626' }; // 上昇=緑, 下落=赤
  
  const color = isUp ? colors.up : colors.down;
  const bodyHeight = Math.abs(close - open);
  const bodyY = Math.min(open, close);
  
  // Y軸のスケール計算
  const yScale = height / (high - low);
  const candleX = x + width / 2;
  
  return (
    <g>
      {/* ヒゲ（高値-安値） */}
      <line
        x1={candleX}
        y1={y}
        x2={candleX}
        y2={y + height}
        stroke={color}
        strokeWidth={1}
      />
      
      {/* 実体（始値-終値） */}
      <rect
        x={x + width * 0.2}
        y={y + (high - Math.max(open, close)) * yScale}
        width={width * 0.6}
        height={bodyHeight * yScale || 1}
        fill={isUp ? color : 'white'}
        stroke={color}
        strokeWidth={1}
      />
    </g>
  );
};

// カスタムツールチップ
const CustomTooltip = ({ active, payload, label, config }: any) => {
  if (!active || !payload || !payload[0]) return null;

  const data = payload[0].payload;
  const date = new Date(data.timestamp).toLocaleDateString('ja-JP');
  
  const colors = config.theme === 'traditional' 
    ? { up: '#dc2626', down: '#2563eb' }
    : { up: '#16a34a', down: '#dc2626' };
  
  const isUp = data.close >= data.open;
  const color = isUp ? colors.up : colors.down;

  return (
    <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
      <p className="font-medium text-gray-900 mb-2">{date}</p>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">始値:</span>
          <span className="font-medium">¥{data.open.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">高値:</span>
          <span className="font-medium">¥{data.high.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">安値:</span>
          <span className="font-medium">¥{data.low.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">終値:</span>
          <span className="font-medium">¥{data.close.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">出来高:</span>
          <span className="font-medium">{data.volume.toLocaleString()}</span>
        </div>
        <div className="flex justify-between border-t pt-1">
          <span className="text-gray-600">変化:</span>
          <span className={`font-medium ${color === colors.up ? 'text-red-600' : 'text-blue-600'}`}>
            {data.change > 0 ? '+' : ''}{data.change.toFixed(2)} ({data.changePercent > 0 ? '+' : ''}{data.changePercent.toFixed(2)}%)
          </span>
        </div>
      </div>
    </div>
  );
};

export function CandlestickChart({ data, config }: CandlestickChartProps) {
  const chartData = useMemo(() => {
    return data.map((item, index) => {
      const prevClose = index > 0 ? data[index - 1].c : item.c;
      const change = item.c - prevClose;
      const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;
      
      return {
        date: new Date(item.t).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' }),
        timestamp: new Date(item.t).getTime(),
        open: item.o,
        high: item.h,
        low: item.l,
        close: item.c,
        volume: item.v,
        change,
        changePercent,
      };
    });
  }, [data]);

  const yDomain = useMemo(() => {
    if (chartData.length === 0) return [0, 100];
    
    const prices = chartData.flatMap(d => [d.high, d.low]);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const padding = (max - min) * 0.1;
    
    if (config.logScale) {
      return [Math.max(min - padding, 1), max + padding];
    }
    
    return [Math.max(min - padding, 0), max + padding];
  }, [chartData, config.logScale]);

  const volumeDomain = useMemo(() => {
    if (chartData.length === 0) return [0, 1000];
    
    const volumes = chartData.map(d => d.volume);
    const maxVolume = Math.max(...volumes);
    return [0, maxVolume * 1.2];
  }, [chartData]);

  if (chartData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        チャートデータがありません
      </div>
    );
  }

  return (
    <div className="h-full">
      {/* 価格チャート */}
      <div className="h-3/4">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#666' }}
              interval="preserveStartEnd"
            />
            <YAxis 
              domain={yDomain}
              scale={config.logScale ? 'log' : 'linear'}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#666' }}
              tickFormatter={(value) => `¥${value.toLocaleString()}`}
            />
            <Tooltip content={<CustomTooltip config={config} />} />
            
            {/* ローソク足を描画するためのダミーバー */}
            <Bar
              dataKey="high"
              fill="transparent"
              shape={(props: any) => <CandlestickBar {...props} config={config} />}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* 出来高チャート */}
      <div className="h-1/4 border-t">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#666' }}
              interval="preserveStartEnd"
            />
            <YAxis 
              domain={volumeDomain}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#666' }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
            />
            <Bar 
              dataKey="volume" 
              fill="#94a3b8"
              opacity={0.7}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
