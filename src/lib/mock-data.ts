// 静的エクスポート用のモックデータ
export const mockStockList = [
  {
    code: "4063",
    name: "信越化学工業",
    market: "PRIME",
    sector: "化学",
    unit: 100,
    listedOn: "1949-05-16T00:00:00.000Z"
  },
  {
    code: "4519", 
    name: "中外製薬",
    market: "PRIME",
    sector: "医薬品",
    unit: 100,
    listedOn: "1949-05-16T00:00:00.000Z"
  },
  {
    code: "6098",
    name: "リクルートホールディングス", 
    market: "PRIME",
    sector: "サービス業",
    unit: 100,
    listedOn: "2014-10-16T00:00:00.000Z"
  },
  {
    code: "6758",
    name: "ソニーグループ",
    market: "PRIME", 
    sector: "電気機器",
    unit: 100,
    listedOn: "1958-12-01T00:00:00.000Z"
  },
  {
    code: "6861",
    name: "キーエンス",
    market: "PRIME",
    sector: "電気機器", 
    unit: 100,
    listedOn: "1995-10-26T00:00:00.000Z"
  },
  {
    code: "7203",
    name: "トヨタ自動車",
    market: "PRIME",
    sector: "輸送用機器",
    unit: 100, 
    listedOn: "1949-05-16T00:00:00.000Z"
  },
  {
    code: "8306",
    name: "三菱UFJフィナンシャル・グループ",
    market: "PRIME",
    sector: "銀行業",
    unit: 100,
    listedOn: "2001-04-02T00:00:00.000Z"
  },
  {
    code: "9432", 
    name: "日本電信電話",
    market: "PRIME",
    sector: "情報・通信業",
    unit: 100,
    listedOn: "1987-02-09T00:00:00.000Z"
  },
  {
    code: "9984",
    name: "ソフトバンクグループ", 
    market: "PRIME",
    sector: "情報・通信業",
    unit: 100,
    listedOn: "1994-07-22T00:00:00.000Z"
  },
  {
    code: "9999",
    name: "サンプル銘柄",
    market: "PRIME",
    sector: "その他",
    unit: 100,
    listedOn: "2020-01-01T00:00:00.000Z"
  }
];

// サンプル価格データ生成関数
export function generateMockPriceData(code: string, days: number = 252) {
  const data = [];
  const basePrice = Math.random() * 5000 + 1000; // 1000-6000の基準価格
  let currentPrice = basePrice;
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    // 価格変動（-5%から+5%）
    const change = (Math.random() - 0.5) * 0.1;
    currentPrice = Math.max(100, currentPrice * (1 + change));
    
    const open = currentPrice;
    const volatility = currentPrice * 0.03; // 3%のボラティリティ
    const high = open + Math.random() * volatility;
    const low = open - Math.random() * volatility;
    const close = low + Math.random() * (high - low);
    const volume = Math.floor(Math.random() * 1000000) + 100000;
    
    data.push({
      code,
      date: date.toISOString().split('T')[0],
      open: Math.round(open),
      high: Math.round(high),
      low: Math.round(low), 
      close: Math.round(close),
      volume,
      adjClose: Math.round(close)
    });
    
    currentPrice = close;
  }
  
  return data;
}

export const mockMarks = [
  { code: "7203", kind: "favorite" },
  { code: "6758", kind: "favorite" },
  { code: "9984", kind: "skip" }
];

export const mockHistory = [
  { code: "7203", viewedAt: new Date().toISOString() },
  { code: "6758", viewedAt: new Date(Date.now() - 3600000).toISOString() },
  { code: "9984", viewedAt: new Date(Date.now() - 7200000).toISOString() }
];
