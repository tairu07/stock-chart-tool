'use client';

import { useState, useEffect } from 'react';
import { Database, RefreshCw } from 'lucide-react';

interface CacheStatsProps {
  getCacheStats: () => {
    total: number;
    valid: number;
    expired: number;
    prefetching: number;
  };
  onCleanup: () => void;
}

export function CacheStats({ getCacheStats, onCleanup }: CacheStatsProps) {
  const [stats, setStats] = useState(getCacheStats());
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(getCacheStats());
    }, 1000);

    return () => clearInterval(interval);
  }, [getCacheStats]);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 p-2 bg-gray-800 text-white rounded-full shadow-lg hover:bg-gray-700 transition-colors"
        title="キャッシュ統計を表示"
      >
        <Database className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border p-4 min-w-[200px]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Database className="w-4 h-4 text-gray-600" />
          <h3 className="text-sm font-medium text-gray-900">キャッシュ統計</h3>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">総エントリ数:</span>
          <span className="font-medium">{stats.total}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">有効:</span>
          <span className="font-medium text-green-600">{stats.valid}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">期限切れ:</span>
          <span className="font-medium text-red-600">{stats.expired}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">取得中:</span>
          <span className="font-medium text-blue-600">{stats.prefetching}</span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t">
        <button
          onClick={onCleanup}
          className="flex items-center space-x-1 text-xs text-gray-600 hover:text-gray-800"
        >
          <RefreshCw className="w-3 h-3" />
          <span>クリーンアップ</span>
        </button>
      </div>

      <div className="mt-2 text-xs text-gray-500">
        ヒット率: {stats.total > 0 ? Math.round((stats.valid / stats.total) * 100) : 0}%
      </div>
    </div>
  );
}
