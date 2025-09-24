'use client';

import { Play, Pause, SkipBack, SkipForward, Gauge } from 'lucide-react';
import type { PlaybackSpeed } from '@/lib/types/api';

interface NavigationControlsProps {
  currentIndex: number;
  totalCount: number;
  isPlaying: boolean;
  speed: PlaybackSpeed;
  onNext: () => void;
  onPrevious: () => void;
  onTogglePlayback: () => void;
  onSpeedChange: (speed: PlaybackSpeed) => void;
}

export function NavigationControls({
  currentIndex,
  totalCount,
  isPlaying,
  speed,
  onNext,
  onPrevious,
  onTogglePlayback,
  onSpeedChange,
}: NavigationControlsProps) {
  const speeds: PlaybackSpeed[] = [1, 2, 3, 5, 10];

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 space-y-4">
      <div className="flex items-center space-x-2">
        <Gauge className="w-5 h-5 text-gray-600" />
        <h2 className="text-lg font-semibold text-gray-900">巡回コントロール</h2>
      </div>

      {/* 進捗表示 */}
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-900">
          {currentIndex + 1} / {totalCount}
        </div>
        <div className="text-sm text-gray-500">
          {totalCount > 0 ? `${Math.round(((currentIndex + 1) / totalCount) * 100)}%` : '0%'}
        </div>
      </div>

      {/* プログレスバー */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{
            width: totalCount > 0 ? `${((currentIndex + 1) / totalCount) * 100}%` : '0%',
          }}
        />
      </div>

      {/* 再生コントロール */}
      <div className="flex items-center justify-center space-x-4">
        <button
          onClick={onPrevious}
          disabled={totalCount === 0}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          title="前の銘柄 (←)"
        >
          <SkipBack className="w-5 h-5" />
        </button>

        <button
          onClick={onTogglePlayback}
          disabled={totalCount === 0}
          className={`flex items-center justify-center w-16 h-16 rounded-full transition-all shadow-lg ${
            isPlaying
              ? 'bg-red-500 hover:bg-red-600 text-white scale-105'
              : 'bg-green-500 hover:bg-green-600 text-white'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          title={isPlaying ? "停止 (Space)" : "全銘柄巡回開始 (Space)"}
        >
          {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
        </button>

        <button
          onClick={onNext}
          disabled={totalCount === 0}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          title="次の銘柄 (→)"
        >
          <SkipForward className="w-5 h-5" />
        </button>
      </div>

      {/* 速度選択 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          巡回速度
        </label>
        <div className="grid grid-cols-5 gap-1">
          {speeds.map((s) => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                speed === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title={`${s}秒間隔 (${s === 10 ? '0' : s})`}
            >
              {s}s
            </button>
          ))}
        </div>
        <div className="text-xs text-gray-500 mt-1 text-center">
          現在: {speed}秒間隔
        </div>
      </div>

      {/* 状態表示 */}
      <div className="pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">状態:</span>
          <span className={`font-medium ${isPlaying ? 'text-green-600' : 'text-gray-600'}`}>
            {isPlaying ? '再生中' : '停止中'}
          </span>
        </div>
        {isPlaying && (
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-gray-600">次の銘柄まで:</span>
            <span className="font-medium text-blue-600">{speed}秒</span>
          </div>
        )}
      </div>
    </div>
  );
}
