// API レスポンスの型定義

export interface StockPrice {
  t: string;  // timestamp (ISO string)
  o: number;  // open
  h: number;  // high
  l: number;  // low
  c: number;  // close
  v: number;  // volume
}

export interface StockDataResponse {
  meta: {
    updatedAt: string;
    datasetId: string;
    code: string;
    name: string;
    market: string;
    period: string;
  };
  data: StockPrice[];
}

export interface StockInfo {
  code: string;
  name: string;
  market: string;
  sector?: string;
  unit?: number;
  listedOn?: string;
  currentPrice?: number;
  previousClose?: number;
  change?: number;
  changePercent?: number;
  dayHigh?: number;
  dayLow?: number;
  volume?: number;
  lastUpdated?: string;
}

export interface StockListResponse {
  data: StockInfo[];
  pagination: {
    page: number;
    size: number;
    total: number;
    totalPages: number;
  };
}

export interface MetaResponse {
  lastUpdated: string;
  datasetId: string;
  totalSymbols: number;
  markets: {
    PRIME: number;
    STANDARD: number;
    GROWTH: number;
  };
}

export interface Mark {
  id: string;
  code: string;
  kind: 'star' | 'skip' | 'tag' | 'note' | 'history';
  payload?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MarksResponse {
  data: Mark[];
}

export interface CreateMarkRequest {
  code: string;
  kind: 'star' | 'skip' | 'tag' | 'note';
  payload?: string;
}

export interface HistoryResponse {
  data: {
    code: string;
    name: string;
    viewedAt: string;
  }[];
}

export interface RevalidateRequest {
  secret: string;
  tags: string[];
}

// フロントエンド用の型定義
export type Period = '1m' | '3m' | '1y' | '3y' | '5y';
export type Market = 'ALL' | 'PRIME' | 'STANDARD' | 'GROWTH';
export type PlaybackSpeed = 1 | 2 | 3 | 5 | 10; // seconds

export interface ChartConfig {
  period: Period;
  logScale: boolean;
  theme: 'traditional' | 'modern'; // 上昇=赤/下落=青 vs 上昇=緑/下落=赤
}

export interface NavigationState {
  currentIndex: number;
  totalCount: number;
  isPlaying: boolean;
  speed: PlaybackSpeed;
  filteredCodes: string[];
}

export interface CacheEntry {
  data: StockDataResponse;
  timestamp: number;
  period: Period;
}

// エラーレスポンス
export interface ApiError {
  error: string;
  message: string;
  code?: string;
}
