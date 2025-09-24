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
} from 'recharts';
import type { StockPrice, ChartConfig } from '@/lib/types/api';

interface CandlestickChartProps {
  data: StockPrice[];
  config: ChartConfig;
}

// yAxisの型を拡張してscale関数を含める
interface YAxisWithScale extends YAxis {
  scale: (value: number) => number;
}

// カスタムローソク足コンポーネント
const CandlestickBar = (props: any) => {
  const { x, width, config, yAxis, payload } = props;
  const { open, high, low, close } = payload;

  if (!yAxis || open === undefined) return null;

  const isUp = close >= open;
  
  const colors = config.theme === 'traditional' 
    ? { up: '#dc2626', down: '#2563eb' }  // 上昇=赤, 下落=青
    : { up: '#16a34a', down: '#dc2626' }; // 上昇=緑, 下落=赤
  
  const color = isUp ? colors.up : colors.down;

  const candleX = x + width / 2;
  const highY = yAxis.scale(high);
  const lowY = yAxis.scale(low);
  const openY = yAxis.scale(open);
  const closeY = yAxis.scale(close);

  const bodyY = Math.min(openY, closeY);
  const bodyHeight = Math.max(1, Math.abs(openY - closeY));

  return (
    <g>
      {/* ヒゲ（高値-安値） */}
      <line
        x1={candleX}
        y1={highY}
        x2={candleX}
        y2={lowY}
        stroke={color}
        strokeWidth={1.5}
      />
      
      {/* 実体（始値-終値） */}
      <rect
        x={x}
        y={bodyY}
        width={width}
        height={bodyHeight}
        fill={isUp ? 'transparent' : color} // 陰線は塗りつぶし
        stroke={color}
        strokeWidth={1.5}
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
  const colorClass = isUp ? (config.theme === 'traditional' ? 'text-red-600' : 'text-green-600') : (config.theme === 'traditional' ? 'text-blue-600' : 'text-red-600');

  return (
    <div className="bg-white/90 p-3 border border-gray-300 rounded-lg shadow-lg backdrop-blur-sm">
      <p className="font-bold text-gray-900 mb-2">{date}</p>
      <div className="space-y-1 text-sm grid grid-cols-2 gap-x-4">
        <span className="text-gray-600">始値:</span>
        <span className="font-medium text-right">¥{data.open.toLocaleString()}</span>
        <span className="text-gray-600">高値:</span>
        <span className="font-medium text-right">¥{data.high.toLocaleString()}</span>
        <span className="text-gray-600">安値:</span>
        <span className="font-medium text-right">¥{data.low.toLocaleString()}</span>
        <span className="text-gray-600">終値:</span>
        <span className="font-medium text-right">¥{data.close.toLocaleString()}</span>
      </div>
      <div className="border-t my-2"></div>
      <div className="space-y-1 text-sm grid grid-cols-2 gap-x-4">
        <span className="text-gray-600">出来高:</span>
        <span className="font-medium text-right">{data.volume.toLocaleString()}</span>
        <span className="text-gray-600">前日比:</span>
        <span className={`font-bold text-right ${colorClass}`}>
          {data.change >= 0 ? '+' : ''}{data.change.toFixed(2)} ({data.changePercent >= 0 ? '+' : ''}{data.changePercent.toFixed(2)}%)
        </span>
      </div>
    </div>
  );
};

export function CandlestickChart({ data, config }: CandlestickChartProps) {
  const { chartData, yDomain, volumeDomain } = useMemo(() => {
    const mappedData = data.map((item, index) => {
      const prevClose = index > 0 ? data[index - 1].c : item.o; // 最初のデータは始値を使う
      const change = item.c - prevClose;
      const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;
      
      return {
        date: new Date(item.t).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' }),
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

    if (mappedData.length === 0) {
      return { chartData: [], yDomain: [0, 100], volumeDomain: [0, 1000] };
    }

    const prices = mappedData.flatMap(d => [d.high, d.low]);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const padding = (max - min) * 0.1;
    
    const yDomain = config.logScale
      ? [Math.max(min * 0.9, 1), max * 1.1]
      : [Math.max(min - padding, 0), max + padding];

    const volumes = mappedData.map(d => d.volume);
    const maxVolume = Math.max(...volumes);
    const volumeDomain = [0, maxVolume * 1.5];

    return { chartData: mappedData, yDomain, volumeDomain };
  }, [data, config.logScale]);

  if (chartData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 bg-gray-50 rounded-md">
        チャートデータを表示できません。
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      {/* 価格チャート */}
      <ResponsiveContainer width="100%" height="75%">
        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: '#6b7280' }}
            interval="auto"
            tickFormatter={(tick) => {
              const date = new Date(tick);
              return `${date.getFullYear()}/${date.getMonth() + 1}`;
            }}
          />
          <YAxis 
            yAxisId="price"
            orientation="right"
            domain={yDomain}
            scale={config.logScale ? 'log' : 'linear'}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickFormatter={(value) => `¥${Number(value).toLocaleString()}`}
            allowDataOverflow
            width={80}
          />
          <Tooltip content={<CustomTooltip config={config} />} />
          
          <Bar
            yAxisId="price"
            dataKey="close" // rechartsが各Barにデータを渡すために必要
            shape={(props: any) => <CandlestickBar {...props} config={config} />}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* 出来高チャート */}
      <ResponsiveContainer width="100%" height="25%">
        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
           <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
           <XAxis 
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tick={false} // 上のチャートとX軸を共有するため非表示
          />
          <YAxis 
            yAxisId="volume"
            orientation="right"
            domain={volumeDomain}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickFormatter={(value) => `${(Number(value) / 1000).toFixed(0)}K`}
            width={80}
          />
          <Tooltip wrapperStyle={{ display: 'none' }} />
          <Bar 
            yAxisId="volume"
            dataKey="volume" 
            isAnimationActive={false}
          >
            {chartData.map((entry, index) => (
              <Bar
                key={`bar-${index}`}
                fill={entry.change >= 0 ? '#a3e635' : '#f87171'} // 簡易的な色分け
                opacity={0.6}
              />
            ))}
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
