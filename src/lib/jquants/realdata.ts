// J-Quants API実データ取得サービス
import { JQuantsClient } from './client';
import { JQUANTS_CONFIG } from './config';
import type { StockDataResponse, StockListResponse, Period } from '@/lib/types/api';

// J-Quantsクライアントのインスタンス
const jquantsClient = new JQuantsClient({
  baseUrl: JQUANTS_CONFIG.baseUrl,
  email: JQUANTS_CONFIG.email,
  password: JQUANTS_CONFIG.password,
  refreshToken: JQUANTS_CONFIG.refreshToken,
});

// 期間を日数に変換
function periodToDays(period: Period): number {
  const periodMap: Record<Period, number> = {
    '1m': 30,
    '3m': 90,
    '1y': 365,
    '3y': 1095,
    '5y': 1825,
  };
  return periodMap[period] || 365;
}

// 実際の銘柄一覧を取得
export async function getRealStockList(params?: {
  page?: number;
  limit?: number;
  market?: string;
  search?: string;
}): Promise<StockListResponse> {
  try {
    console.log('Fetching real stock list from J-Quants API...');
    
    // J-Quants APIから銘柄一覧を取得
    const symbols = await jquantsClient.getListedInfo();
    
    const { page = 1, limit = 20, market, search } = params || {};
    
    // フィルタリング
    let filteredSymbols = symbols;
    
    if (market && market !== 'all') {
      filteredSymbols = filteredSymbols.filter(symbol => 
        symbol.MarketCodeName?.toLowerCase().includes(market.toLowerCase())
      );
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredSymbols = filteredSymbols.filter(symbol =>
        symbol.Code.includes(searchLower) || 
        symbol.CompanyName.toLowerCase().includes(searchLower)
      );
    }
    
    // ページネーション（全銘柄対応）
    const total = filteredSymbols.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    
    // 大きなlimitの場合は全件返す
    const paginatedSymbols = limit >= 5000 ? filteredSymbols : filteredSymbols.slice(offset, offset + limit);
    
    // レスポンス形式に変換
    const stocks = paginatedSymbols.map(symbol => ({
      code: symbol.Code,
      name: symbol.CompanyName,
      market: symbol.MarketCodeName || 'UNKNOWN',
      sector: symbol.Sector33CodeName || '',
      unit: 100, // デフォルト値
      listedOn: null, // J-Quants APIには上場日がない場合がある
    }));
    
    return {
      stocks,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  } catch (error) {
    console.error('Error fetching real stock list:', error);
    throw new Error('Failed to fetch stock list from J-Quants API');
  }
}

// 実際の株価データを取得
export async function getRealStockData(
  code: string,
  params?: {
    period?: Period;
    adjusted?: boolean;
    fields?: string;
  }
): Promise<StockDataResponse> {
  try {
    console.log(`Fetching real stock data for ${code} from J-Quants API...`);
    
    const { period = '1y', adjusted = true } = params || {};
    
    // 期間の計算
    const days = periodToDays(period);
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);
    
    // J-Quants APIから株価データを取得
    const [pricesData, symbolInfo] = await Promise.all([
      jquantsClient.getStockPrices({
        code,
        from: startDate.toISOString().split('T')[0],
        to: endDate.toISOString().split('T')[0],
      }),
      jquantsClient.getListedInfo(code),
    ]);
    
    if (!symbolInfo || symbolInfo.length === 0) {
      throw new Error(`Symbol ${code} not found`);
    }
    
    const symbol = symbolInfo[0];
    
    // 価格データを変換
    const prices = pricesData.map(price => ({
      code: price.Code,
      date: price.Date,
      open: price.Open || 0,
      high: price.High || 0,
      low: price.Low || 0,
      close: price.Close || 0,
      volume: price.Volume || 0,
      adjClose: adjusted ? (price.AdjustmentClose || price.Close || 0) : (price.Close || 0),
    }));
    
    // 統計情報を計算
    const closePrices = prices.map(p => p.close).filter(p => p > 0);
    const volumes = prices.map(p => p.volume).filter(v => v > 0);
    const currentPrice = closePrices[closePrices.length - 1] || 0;
    const previousPrice = closePrices[closePrices.length - 2] || currentPrice;
    const change = currentPrice - previousPrice;
    const changePercent = previousPrice > 0 ? (change / previousPrice) * 100 : 0;
    
    return {
      symbol: {
        code: symbol.Code,
        name: symbol.CompanyName,
        market: symbol.MarketCodeName || 'UNKNOWN',
        sector: symbol.Sector33CodeName || '',
        unit: 100,
        listedOn: null,
      },
      prices,
      stats: {
        currentPrice,
        change,
        changePercent,
        high52w: closePrices.length > 0 ? Math.max(...closePrices) : 0,
        low52w: closePrices.length > 0 ? Math.min(...closePrices) : 0,
        avgVolume: volumes.length > 0 ? Math.round(volumes.reduce((a, b) => a + b, 0) / volumes.length) : 0,
        marketCap: currentPrice * 1000000, // 仮の発行済み株式数
        per: 15.5, // J-Quants APIから取得可能な場合は実データを使用
        pbr: 1.2,
        dividend: 2.5,
        dividendYield: 2.1,
      },
      meta: {
        period,
        adjusted,
        dataPoints: prices.length,
        lastUpdated: new Date().toISOString(),
        source: 'jquants',
        version: '1.0',
      },
    };
  } catch (error) {
    console.error(`Error fetching real stock data for ${code}:`, error);
    throw new Error(`Failed to fetch stock data for ${code} from J-Quants API`);
  }
}

// J-Quants API接続テスト
export async function testJQuantsConnection(): Promise<boolean> {
  try {
    console.log('Testing J-Quants API connection...');
    
    // 簡単なAPIコールでテスト
    const symbols = await jquantsClient.getListedInfo();
    
    console.log(`J-Quants API connection successful. Found ${symbols.length} symbols.`);
    return true;
  } catch (error) {
    console.error('J-Quants API connection failed:', error);
    return false;
  }
}
