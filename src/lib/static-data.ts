// 静的エクスポート用のデータフェッチ関数
import { mockStockList, generateMockPriceData, mockMarks, mockHistory } from './mock-data';
import type { StockListResponse, StockDataResponse, Period } from './types/api';

// 銘柄一覧取得（静的版）
export async function getStaticStockList(params?: {
  page?: number;
  limit?: number;
  market?: string;
  search?: string;
}): Promise<StockListResponse> {
  const { page = 1, limit = 20, market, search } = params || {};
  
  let filteredStocks = [...mockStockList];
  
  // 市場フィルタ
  if (market && market !== 'all') {
    filteredStocks = filteredStocks.filter(stock => 
      stock.market.toLowerCase() === market.toLowerCase()
    );
  }
  
  // 検索フィルタ
  if (search) {
    const searchLower = search.toLowerCase();
    filteredStocks = filteredStocks.filter(stock =>
      stock.code.includes(searchLower) || 
      stock.name.toLowerCase().includes(searchLower)
    );
  }
  
  const total = filteredStocks.length;
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;
  const stocks = filteredStocks.slice(offset, offset + limit);
  
  return {
    stocks,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  };
}

// 株価データ取得（静的版）
export async function getStaticStockData(
  code: string,
  params?: {
    period?: Period;
    adjusted?: boolean;
    fields?: string;
  }
): Promise<StockDataResponse> {
  const { period = '1y', adjusted = true } = params || {};
  
  // 銘柄情報を取得
  const symbol = mockStockList.find(s => s.code === code);
  if (!symbol) {
    throw new Error(`Symbol ${code} not found`);
  }
  
  // 期間に応じた日数を計算
  const periodDays: Record<Period, number> = {
    '1m': 21,
    '3m': 63,
    '1y': 252,
    '3y': 756,
    '5y': 1260
  };
  
  const days = periodDays[period] || 252;
  
  // モック価格データを生成
  const prices = generateMockPriceData(code, days);
  
  // 統計情報を計算
  const closePrices = prices.map(p => p.close);
  const volumes = prices.map(p => p.volume);
  const currentPrice = closePrices[closePrices.length - 1];
  const previousPrice = closePrices[closePrices.length - 2];
  const change = currentPrice - previousPrice;
  const changePercent = (change / previousPrice) * 100;
  
  return {
    symbol: {
      code: symbol.code,
      name: symbol.name,
      market: symbol.market,
      sector: symbol.sector,
      unit: symbol.unit,
      listedOn: symbol.listedOn
    },
    prices,
    stats: {
      currentPrice,
      change,
      changePercent,
      high52w: Math.max(...closePrices),
      low52w: Math.min(...closePrices),
      avgVolume: Math.round(volumes.reduce((a, b) => a + b, 0) / volumes.length),
      marketCap: currentPrice * 1000000, // 仮の発行済み株式数
      per: 15.5,
      pbr: 1.2,
      dividend: 2.5,
      dividendYield: 2.1
    },
    meta: {
      period,
      adjusted,
      dataPoints: prices.length,
      lastUpdated: new Date().toISOString(),
      source: 'mock',
      version: '1.0'
    }
  };
}

// マーク取得（静的版）
export async function getStaticMarks(kind?: string) {
  let marks = [...mockMarks];
  
  if (kind) {
    marks = marks.filter(mark => mark.kind === kind);
  }
  
  return { marks };
}

// 履歴取得（静的版）
export async function getStaticHistory(limit: number = 100) {
  const history = mockHistory.slice(0, limit);
  return { history };
}

// メタデータ取得（静的版）
export async function getStaticMeta() {
  return {
    version: '2.0.0',
    datasetVersion: '1.0',
    lastUpdated: new Date().toISOString(),
    symbolCount: mockStockList.length,
    markets: ['PRIME', 'STANDARD', 'GROWTH'],
    supportedPeriods: ['1m', '3m', '1y', '3y', '5y'],
    features: [
      'realtime_charts',
      'auto_navigation', 
      'favorites',
      'history',
      'search',
      'market_filter'
    ]
  };
}
