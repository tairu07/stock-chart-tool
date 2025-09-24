// J-Quants API フォールバック機能
import { prisma } from '@/lib/db/client';
import type { StockDataResponse, StockListResponse, Period } from '@/lib/types/api';

// フォールバック用の銘柄一覧を取得
export async function getFallbackStockList(params?: {
  page?: number;
  limit?: number;
  market?: string;
  search?: string;
}): Promise<StockListResponse> {
  console.log('Using fallback stock list from database...');
  
  const { page = 1, limit = 20, market, search } = params || {};
  
  // クエリ条件を構築
  const where: any = {};
  
  if (market && market !== 'all') {
    where.market = market.toUpperCase();
  }
  
  if (search) {
    where.OR = [
      { code: { contains: search } },
      { name: { contains: search } }
    ];
  }

  // 総数を取得
  const total = await prisma.symbol.count({ where });
  
  // ページネーション計算
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;

  // データを取得
  const symbols = await prisma.symbol.findMany({
    where,
    orderBy: { code: 'asc' },
    skip: limit >= 5000 ? 0 : offset, // 大きなlimitの場合は全件
    take: limit >= 5000 ? undefined : limit,
  });

  return {
    stocks: symbols.map(symbol => ({
      code: symbol.code,
      name: symbol.name,
      market: symbol.market,
      sector: symbol.sector || '',
      unit: symbol.unit,
      listedOn: symbol.listedOn?.toISOString() || null,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

// フォールバック用の株価データを取得
export async function getFallbackStockData(
  code: string,
  params?: {
    period?: Period;
    adjusted?: boolean;
  }
): Promise<StockDataResponse> {
  console.log(`Using fallback stock data for ${code} from database...`);
  
  const { period = '1y', adjusted = true } = params || {};
  
  // 銘柄情報を取得
  const symbol = await prisma.symbol.findUnique({
    where: { code },
  });

  if (!symbol) {
    throw new Error(`Symbol ${code} not found in database`);
  }

  // 期間の開始日を計算
  const periodDays: Record<Period, number> = {
    '1m': 30,
    '3m': 90,
    '1y': 365,
    '3y': 1095,
    '5y': 1825,
  };
  
  const days = periodDays[period] || 365;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const endDate = new Date();

  // 価格データを取得
  const prices = await prisma.price.findMany({
    where: {
      code,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { date: 'asc' },
  });

  // 統計情報を計算
  const closePrices = prices.map(p => p.close);
  const volumes = prices.map(p => p.volume);
  const currentPrice = closePrices[closePrices.length - 1] || 0;
  const previousPrice = closePrices[closePrices.length - 2] || currentPrice;
  const change = currentPrice - previousPrice;
  const changePercent = previousPrice > 0 ? (change / previousPrice) * 100 : 0;

  return {
    symbol: {
      code: symbol.code,
      name: symbol.name,
      market: symbol.market,
      sector: symbol.sector || '',
      unit: symbol.unit,
      listedOn: symbol.listedOn?.toISOString() || null,
    },
    prices: prices.map(price => ({
      code: price.code,
      date: price.date.toISOString().split('T')[0],
      open: price.open,
      high: price.high,
      low: price.low,
      close: price.close,
      volume: price.volume,
      adjClose: adjusted ? price.adjClose : price.close,
    })),
    stats: {
      currentPrice,
      change,
      changePercent,
      high52w: closePrices.length > 0 ? Math.max(...closePrices) : 0,
      low52w: closePrices.length > 0 ? Math.min(...closePrices) : 0,
      avgVolume: volumes.length > 0 ? Math.round(volumes.reduce((a, b) => a + b, 0) / volumes.length) : 0,
      marketCap: currentPrice * 1000000, // 仮の発行済み株式数
      per: 15.5,
      pbr: 1.2,
      dividend: 2.5,
      dividendYield: 2.1,
    },
    meta: {
      period,
      adjusted,
      dataPoints: prices.length,
      lastUpdated: new Date().toISOString(),
      source: 'database-fallback',
      version: '1.0',
    },
  };
}
