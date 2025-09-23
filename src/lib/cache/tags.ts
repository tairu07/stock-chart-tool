// キャッシュタグの命名規則と管理

export const CACHE_TAGS = {
  // 株価データ関連
  stock: (code: string, period?: string) => 
    period ? `stock:${code}:${period}` : `stock:${code}`,
  
  // 銘柄リスト関連
  list: (market?: string) => 
    market ? `list:${market}` : 'list',
  
  // メタデータ関連
  meta: 'meta',
  
  // マーク関連
  marks: (code?: string) => 
    code ? `marks:${code}` : 'marks',
  
  // 履歴関連
  history: 'history',
  
  // スナップショット関連
  snapshot: (code: string, period: string) => 
    `snapshot:${code}:${period}`,
  
  // データセット関連
  dataset: (version: string) => `dataset:${version}`,
} as const;

// 全ての株価データを無効化するためのワイルドカードタグ
export const WILDCARD_TAGS = {
  allStocks: 'stock:*',
  allLists: 'list:*',
  allMarks: 'marks:*',
  allSnapshots: 'snapshot:*',
} as const;

// EOD更新時に無効化すべきタグのリスト
export const EOD_REVALIDATE_TAGS = [
  WILDCARD_TAGS.allStocks,
  WILDCARD_TAGS.allLists,
  WILDCARD_TAGS.allSnapshots,
  CACHE_TAGS.meta,
] as const;

// 当日更新時に無効化すべきタグのリスト
export const INTRADAY_REVALIDATE_TAGS = [
  CACHE_TAGS.meta,
] as const;

export type CacheTag = string;
