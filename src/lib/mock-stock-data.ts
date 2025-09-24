import type { StockDataResponse, Period } from '@/lib/types/api';

// 銘柄名マッピング
const stockNames: Record<string, string> = {
  '1301': '極洋',
  '1332': '日本水産',
  '4063': '信越化学工業',
  '4502': '武田薬品工業',
  '6758': 'ソニーグループ',
  '7203': 'トヨタ自動車',
  '8001': '伊藤忠商事',
  '8306': '三菱UFJフィナンシャル・グループ',
  '9432': '日本電信電話',
  '9984': 'ソフトバンクグループ',
};

// 期間に応じた日数を取得
function getPeriodDays(period: Period): number {
  switch (period) {
    case '1m': return 30;
    case '3m': return 90;
    case '1y': return 260;
    case '3y': return 780;
    case '5y': return 1300;
    default: return 260;
  }
}

// モック株価データを生成
export function generateMockStockData(code: string, period: Period): StockDataResponse {
  const days = getPeriodDays(period);
  const name = stockNames[code] || `銘柄${code}`;
  
  // 基準価格（銘柄コードに基づいて設定）
  const basePrice = parseInt(code) % 1000 + 1000;
  
  const prices = [];
  let currentPrice = basePrice;
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // ランダムな価格変動（-3% ~ +3%）
    const change = (Math.random() - 0.5) * 0.06;
    currentPrice = Math.max(currentPrice * (1 + change), 100);
    
    const open = currentPrice * (0.98 + Math.random() * 0.04);
    const close = currentPrice;
    const high = Math.max(open, close) * (1 + Math.random() * 0.02);
    const low = Math.min(open, close) * (1 - Math.random() * 0.02);
    const volume = Math.floor(Math.random() * 1000000) + 100000;
    
    prices.push({
      date: date.toISOString().split('T')[0],
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume,
    });
  }
  
  const latestPrice = prices[prices.length - 1];
  const previousPrice = prices[prices.length - 2];
  const change = latestPrice.close - previousPrice.close;
  const changePercent = (change / previousPrice.close) * 100;
  
  return {
    code,
    name,
    market: 'PRIME',
    sector: '情報・通信業',
    prices,
    meta: {
      currentPrice: latestPrice.close,
      change,
      changePercent,
      volume: latestPrice.volume,
      high52w: Math.max(...prices.map(p => p.high)),
      low52w: Math.min(...prices.map(p => p.low)),
      marketCap: Math.floor(latestPrice.close * 1000000000),
      per: 15.5 + Math.random() * 10,
      pbr: 1.2 + Math.random() * 2,
      dividend: Math.round((latestPrice.close * 0.02 + Math.random() * 0.03) * 100) / 100,
      dividendYield: 2.0 + Math.random() * 3,
    },
  };
}
