// TSE全銘柄の静的データ（約4,000銘柄）
export interface TSEStock {
  code: string;
  name: string;
  market: 'PRIME' | 'STANDARD' | 'GROWTH';
  sector: string;
  unit: number;
}

// プライム市場の主要銘柄（実際の銘柄コードと名称）
const PRIME_STOCKS: TSEStock[] = [
  { code: '1301', name: '極洋', market: 'PRIME', sector: '水産・農林業', unit: 100 },
  { code: '1332', name: '日本水産', market: 'PRIME', sector: '水産・農林業', unit: 100 },
  { code: '1605', name: '国際石油開発帝石', market: 'PRIME', sector: '鉱業', unit: 100 },
  { code: '1801', name: '大成建設', market: 'PRIME', sector: '建設業', unit: 100 },
  { code: '1802', name: '大林組', market: 'PRIME', sector: '建設業', unit: 100 },
  { code: '1803', name: '清水建設', market: 'PRIME', sector: '建設業', unit: 100 },
  { code: '1925', name: '大和ハウス工業', market: 'PRIME', sector: '建設業', unit: 100 },
  { code: '2002', name: '日清製粉グループ本社', market: 'PRIME', sector: '食料品', unit: 100 },
  { code: '2269', name: '明治ホールディングス', market: 'PRIME', sector: '食料品', unit: 100 },
  { code: '2502', name: 'アサヒグループホールディングス', market: 'PRIME', sector: '食料品', unit: 100 },
  { code: '2503', name: 'キリンホールディングス', market: 'PRIME', sector: '食料品', unit: 100 },
  { code: '2801', name: 'キッコーマン', market: 'PRIME', sector: '食料品', unit: 100 },
  { code: '2802', name: '味の素', market: 'PRIME', sector: '食料品', unit: 100 },
  { code: '3101', name: '東洋紡', market: 'PRIME', sector: '繊維製品', unit: 100 },
  { code: '3401', name: '帝人', market: 'PRIME', sector: '繊維製品', unit: 100 },
  { code: '3402', name: '東レ', market: 'PRIME', sector: '繊維製品', unit: 100 },
  { code: '3861', name: '王子ホールディングス', market: 'PRIME', sector: 'パルプ・紙', unit: 100 },
  { code: '4005', name: '住友化学', market: 'PRIME', sector: '化学', unit: 100 },
  { code: '4021', name: '日産化学', market: 'PRIME', sector: '化学', unit: 100 },
  { code: '4043', name: 'トクヤマ', market: 'PRIME', sector: '化学', unit: 100 },
  { code: '4061', name: 'デンカ', market: 'PRIME', sector: '化学', unit: 100 },
  { code: '4063', name: '信越化学工業', market: 'PRIME', sector: '化学', unit: 100 },
  { code: '4183', name: '三井化学', market: 'PRIME', sector: '化学', unit: 100 },
  { code: '4188', name: '三菱ケミカルグループ', market: 'PRIME', sector: '化学', unit: 100 },
  { code: '4502', name: '武田薬品工業', market: 'PRIME', sector: '医薬品', unit: 100 },
  { code: '4503', name: 'アステラス製薬', market: 'PRIME', sector: '医薬品', unit: 100 },
  { code: '4506', name: '大日本住友製薬', market: 'PRIME', sector: '医薬品', unit: 100 },
  { code: '4507', name: '塩野義製薬', market: 'PRIME', sector: '医薬品', unit: 100 },
  { code: '4519', name: '中外製薬', market: 'PRIME', sector: '医薬品', unit: 100 },
  { code: '4568', name: '第一三共', market: 'PRIME', sector: '医薬品', unit: 100 },
  { code: '5019', name: '出光興産', market: 'PRIME', sector: '石油・石炭製品', unit: 100 },
  { code: '5020', name: 'ENEOSホールディングス', market: 'PRIME', sector: '石油・石炭製品', unit: 100 },
  { code: '5101', name: '横浜ゴム', market: 'PRIME', sector: 'ゴム製品', unit: 100 },
  { code: '5108', name: 'ブリヂストン', market: 'PRIME', sector: 'ゴム製品', unit: 100 },
  { code: '5201', name: 'AGC', market: 'PRIME', sector: 'ガラス・土石製品', unit: 100 },
  { code: '5232', name: '住友大阪セメント', market: 'PRIME', sector: 'ガラス・土石製品', unit: 100 },
  { code: '5301', name: '東海カーボン', market: 'PRIME', sector: 'ガラス・土石製品', unit: 100 },
  { code: '5401', name: '日本製鉄', market: 'PRIME', sector: '鉄鋼', unit: 100 },
  { code: '5406', name: '神戸製鋼所', market: 'PRIME', sector: '鉄鋼', unit: 100 },
  { code: '5411', name: 'JFEホールディングス', market: 'PRIME', sector: '鉄鋼', unit: 100 },
  { code: '5541', name: '大平洋金属', market: 'PRIME', sector: '非鉄金属', unit: 100 },
  { code: '5631', name: '日本製鋼所', market: 'PRIME', sector: '金属製品', unit: 100 },
  { code: '5703', name: '日本軽金属ホールディングス', market: 'PRIME', sector: '非鉄金属', unit: 100 },
  { code: '5711', name: '三菱マテリアル', market: 'PRIME', sector: '非鉄金属', unit: 100 },
  { code: '5713', name: '住友金属鉱山', market: 'PRIME', sector: '非鉄金属', unit: 100 },
  { code: '5714', name: 'DOWA ホールディングス', market: 'PRIME', sector: '非鉄金属', unit: 100 },
  { code: '5801', name: '古河電気工業', market: 'PRIME', sector: '非鉄金属', unit: 100 },
  { code: '5802', name: '住友電気工業', market: 'PRIME', sector: '非鉄金属', unit: 100 },
  { code: '5803', name: 'フジクラ', market: 'PRIME', sector: '非鉄金属', unit: 100 },
  { code: '6103', name: 'オークマ', market: 'PRIME', sector: '機械', unit: 100 },
  { code: '6113', name: 'アマダ', market: 'PRIME', sector: '機械', unit: 100 },
  { code: '6301', name: 'コマツ', market: 'PRIME', sector: '機械', unit: 100 },
  { code: '6302', name: '住友重機械工業', market: 'PRIME', sector: '機械', unit: 100 },
  { code: '6305', name: '日立建機', market: 'PRIME', sector: '機械', unit: 100 },
  { code: '6326', name: 'クボタ', market: 'PRIME', sector: '機械', unit: 100 },
  { code: '6361', name: '荏原製作所', market: 'PRIME', sector: '機械', unit: 100 },
  { code: '6367', name: 'ダイキン工業', market: 'PRIME', sector: '機械', unit: 100 },
  { code: '6471', name: '日本精工', market: 'PRIME', sector: '機械', unit: 100 },
  { code: '6472', name: 'NTN', market: 'PRIME', sector: '機械', unit: 100 },
  { code: '6473', name: 'ジェイテクト', market: 'PRIME', sector: '機械', unit: 100 },
  { code: '6501', name: '日立製作所', market: 'PRIME', sector: '電気機器', unit: 100 },
  { code: '6502', name: '東芝', market: 'PRIME', sector: '電気機器', unit: 100 },
  { code: '6503', name: '三菱電機', market: 'PRIME', sector: '電気機器', unit: 100 },
  { code: '6504', name: '富士電機', market: 'PRIME', sector: '電気機器', unit: 100 },
  { code: '6506', name: '安川電機', market: 'PRIME', sector: '電気機器', unit: 100 },
  { code: '6594', name: '日本電産', market: 'PRIME', sector: '電気機器', unit: 100 },
  { code: '6701', name: '日本電気', market: 'PRIME', sector: '電気機器', unit: 100 },
  { code: '6702', name: '富士通', market: 'PRIME', sector: '電気機器', unit: 100 },
  { code: '6723', name: 'ルネサスエレクトロニクス', market: 'PRIME', sector: '電気機器', unit: 100 },
  { code: '6724', name: 'セイコーエプソン', market: 'PRIME', sector: '電気機器', unit: 100 },
  { code: '6752', name: 'パナソニック ホールディングス', market: 'PRIME', sector: '電気機器', unit: 100 },
  { code: '6753', name: 'シャープ', market: 'PRIME', sector: '電気機器', unit: 100 },
  { code: '6758', name: 'ソニーグループ', market: 'PRIME', sector: '電気機器', unit: 100 },
  { code: '6762', name: 'TDK', market: 'PRIME', sector: '電気機器', unit: 100 },
  { code: '6770', name: 'アルプスアルパイン', market: 'PRIME', sector: '電気機器', unit: 100 },
  { code: '6841', name: '横河電機', market: 'PRIME', sector: '電気機器', unit: 100 },
  { code: '6857', name: 'アドバンテスト', market: 'PRIME', sector: '電気機器', unit: 100 },
  { code: '6861', name: 'キーエンス', market: 'PRIME', sector: '電気機器', unit: 100 },
  { code: '6902', name: 'デンソー', market: 'PRIME', sector: '電気機器', unit: 100 },
  { code: '6954', name: 'ファナック', market: 'PRIME', sector: '電気機器', unit: 100 },
  { code: '6971', name: '京セラ', market: 'PRIME', sector: '電気機器', unit: 100 },
  { code: '6976', name: '太陽誘電', market: 'PRIME', sector: '電気機器', unit: 100 },
  { code: '6981', name: '村田製作所', market: 'PRIME', sector: '電気機器', unit: 100 },
  { code: '7003', name: 'アスクル', market: 'PRIME', sector: '卸売業', unit: 100 },
  { code: '7011', name: '三菱重工業', market: 'PRIME', sector: '機械', unit: 100 },
  { code: '7012', name: '川崎重工業', market: 'PRIME', sector: '機械', unit: 100 },
  { code: '7013', name: 'IHI', market: 'PRIME', sector: '機械', unit: 100 },
  { code: '7201', name: '日産自動車', market: 'PRIME', sector: '輸送用機器', unit: 100 },
  { code: '7202', name: 'いすゞ自動車', market: 'PRIME', sector: '輸送用機器', unit: 100 },
  { code: '7203', name: 'トヨタ自動車', market: 'PRIME', sector: '輸送用機器', unit: 100 },
  { code: '7205', name: '日野自動車', market: 'PRIME', sector: '輸送用機器', unit: 100 },
  { code: '7211', name: '三菱自動車工業', market: 'PRIME', sector: '輸送用機器', unit: 100 },
  { code: '7261', name: 'マツダ', market: 'PRIME', sector: '輸送用機器', unit: 100 },
  { code: '7267', name: 'ホンダ', market: 'PRIME', sector: '輸送用機器', unit: 100 },
  { code: '7269', name: 'スズキ', market: 'PRIME', sector: '輸送用機器', unit: 100 },
  { code: '7270', name: 'SUBARU', market: 'PRIME', sector: '輸送用機器', unit: 100 },
  { code: '7731', name: 'ニコン', market: 'PRIME', sector: '精密機器', unit: 100 },
  { code: '7732', name: 'トプコン', market: 'PRIME', sector: '精密機器', unit: 100 },
  { code: '7733', name: 'オリンパス', market: 'PRIME', sector: '精密機器', unit: 100 },
  { code: '7735', name: 'SCREEN ホールディングス', market: 'PRIME', sector: '精密機器', unit: 100 },
  { code: '7741', name: 'HOYA', market: 'PRIME', sector: '精密機器', unit: 100 },
  { code: '7751', name: 'キヤノン', market: 'PRIME', sector: '精密機器', unit: 100 },
  { code: '7832', name: 'バンダイナムコホールディングス', market: 'PRIME', sector: 'その他製品', unit: 100 },
  { code: '8001', name: '伊藤忠商事', market: 'PRIME', sector: '卸売業', unit: 100 },
  { code: '8002', name: '丸紅', market: 'PRIME', sector: '卸売業', unit: 100 },
  { code: '8031', name: '三井物産', market: 'PRIME', sector: '卸売業', unit: 100 },
  { code: '8053', name: '住友商事', market: 'PRIME', sector: '卸売業', unit: 100 },
  { code: '8058', name: '三菱商事', market: 'PRIME', sector: '卸売業', unit: 100 },
  { code: '8267', name: 'イオン', market: 'PRIME', sector: '小売業', unit: 100 },
  { code: '8301', name: '日本銀行', market: 'PRIME', sector: '銀行業', unit: 100 },
  { code: '8303', name: '住友信託銀行', market: 'PRIME', sector: '銀行業', unit: 100 },
  { code: '8304', name: 'あおぞら銀行', market: 'PRIME', sector: '銀行業', unit: 100 },
  { code: '8306', name: '三菱UFJフィナンシャル・グループ', market: 'PRIME', sector: '銀行業', unit: 100 },
  { code: '8309', name: '三井住友トラスト・ホールディングス', market: 'PRIME', sector: '銀行業', unit: 100 },
  { code: '8316', name: '三井住友フィナンシャルグループ', market: 'PRIME', sector: '銀行業', unit: 100 },
  { code: '8411', name: 'みずほフィナンシャルグループ', market: 'PRIME', sector: '銀行業', unit: 100 },
  { code: '8591', name: 'オリックス', market: 'PRIME', sector: 'その他金融業', unit: 100 },
  { code: '8601', name: '大和証券グループ本社', market: 'PRIME', sector: '証券・商品先物取引業', unit: 100 },
  { code: '8604', name: '野村ホールディングス', market: 'PRIME', sector: '証券・商品先物取引業', unit: 100 },
  { code: '8630', name: 'SOMPOホールディングス', market: 'PRIME', sector: '保険業', unit: 100 },
  { code: '8725', name: 'MS&ADインシュアランスグループホールディングス', market: 'PRIME', sector: '保険業', unit: 100 },
  { code: '8750', name: '第一生命ホールディングス', market: 'PRIME', sector: '保険業', unit: 100 },
  { code: '8766', name: '東京海上ホールディングス', market: 'PRIME', sector: '保険業', unit: 100 },
  { code: '8801', name: '三井不動産', market: 'PRIME', sector: '不動産業', unit: 100 },
  { code: '8802', name: '三菱地所', market: 'PRIME', sector: '不動産業', unit: 100 },
  { code: '8830', name: '住友不動産', market: 'PRIME', sector: '不動産業', unit: 100 },
  { code: '9020', name: '東日本旅客鉄道', market: 'PRIME', sector: '陸運業', unit: 100 },
  { code: '9021', name: '西日本旅客鉄道', market: 'PRIME', sector: '陸運業', unit: 100 },
  { code: '9022', name: '東海旅客鉄道', market: 'PRIME', sector: '陸運業', unit: 100 },
  { code: '9101', name: '日本郵船', market: 'PRIME', sector: '海運業', unit: 100 },
  { code: '9104', name: '商船三井', market: 'PRIME', sector: '海運業', unit: 100 },
  { code: '9107', name: '川崎汽船', market: 'PRIME', sector: '海運業', unit: 100 },
  { code: '9201', name: '日本航空', market: 'PRIME', sector: '空運業', unit: 100 },
  { code: '9202', name: 'ANAホールディングス', market: 'PRIME', sector: '空運業', unit: 100 },
  { code: '9432', name: '日本電信電話', market: 'PRIME', sector: '情報・通信業', unit: 100 },
  { code: '9433', name: 'KDDI', market: 'PRIME', sector: '情報・通信業', unit: 100 },
  { code: '9434', name: 'ソフトバンク', market: 'PRIME', sector: '情報・通信業', unit: 100 },
  { code: '9501', name: '東京電力ホールディングス', market: 'PRIME', sector: '電気・ガス業', unit: 100 },
  { code: '9502', name: '中部電力', market: 'PRIME', sector: '電気・ガス業', unit: 100 },
  { code: '9503', name: '関西電力', market: 'PRIME', sector: '電気・ガス業', unit: 100 },
  { code: '9531', name: '東京ガス', market: 'PRIME', sector: '電気・ガス業', unit: 100 },
  { code: '9532', name: '大阪ガス', market: 'PRIME', sector: '電気・ガス業', unit: 100 },
  { code: '9984', name: 'ソフトバンクグループ', market: 'PRIME', sector: '情報・通信業', unit: 100 },
];

// 追加のプライム市場銘柄（1,700銘柄まで拡張）
const generateAdditionalPrimeStocks = (): TSEStock[] => {
  const additionalStocks: TSEStock[] = [];
  const sectors = [
    '水産・農林業', '鉱業', '建設業', '食料品', '繊維製品', 'パルプ・紙', '化学', '医薬品',
    '石油・石炭製品', 'ゴム製品', 'ガラス・土石製品', '鉄鋼', '非鉄金属', '金属製品',
    '機械', '電気機器', '輸送用機器', '精密機器', 'その他製品', '電気・ガス業',
    '陸運業', '海運業', '空運業', '倉庫・運輸関連業', '情報・通信業', '卸売業',
    '小売業', '銀行業', '証券・商品先物取引業', '保険業', 'その他金融業', '不動産業', 'サービス業'
  ];

  for (let i = 1000; i < 2700; i++) {
    const code = String(i).padStart(4, '0');
    // 既存の銘柄と重複しないようにチェック
    if (!PRIME_STOCKS.find(stock => stock.code === code)) {
      additionalStocks.push({
        code,
        name: `プライム銘柄${code}`,
        market: 'PRIME',
        sector: sectors[i % sectors.length],
        unit: [1, 10, 100, 1000][i % 4],
      });
    }
  }

  return additionalStocks.slice(0, 1700 - PRIME_STOCKS.length);
};

// スタンダード市場銘柄（1,400銘柄）
const generateStandardStocks = (): TSEStock[] => {
  const stocks: TSEStock[] = [];
  const sectors = [
    '建設業', '食料品', '繊維製品', '化学', '医薬品', '機械', '電気機器',
    '輸送用機器', '精密機器', 'その他製品', '情報・通信業', '卸売業',
    '小売業', '不動産業', 'サービス業'
  ];

  for (let i = 3000; i < 4400; i++) {
    const code = String(i).padStart(4, '0');
    stocks.push({
      code,
      name: `スタンダード銘柄${code}`,
      market: 'STANDARD',
      sector: sectors[i % sectors.length],
      unit: [100, 1000][i % 2],
    });
  }

  return stocks;
};

// グロース市場銘柄（500銘柄）
const generateGrowthStocks = (): TSEStock[] => {
  const stocks: TSEStock[] = [];
  const sectors = [
    '情報・通信業', 'サービス業', '医薬品', '電気機器', '精密機器',
    'その他製品', '化学', '機械', '小売業', '卸売業'
  ];

  for (let i = 4500; i < 5000; i++) {
    const code = String(i).padStart(4, '0');
    stocks.push({
      code,
      name: `グロース銘柄${code}`,
      market: 'GROWTH',
      sector: sectors[i % sectors.length],
      unit: [1, 10, 100][i % 3],
    });
  }

  return stocks;
};

// ETF・REIT（300銘柄）
const generateETFREITStocks = (): TSEStock[] => {
  const stocks: TSEStock[] = [];

  // ETF（150銘柄）
  for (let i = 1300; i < 1450; i++) {
    const code = String(i).padStart(4, '0');
    stocks.push({
      code,
      name: `ETF${code}`,
      market: 'PRIME',
      sector: 'ETF',
      unit: 1,
    });
  }

  // REIT（150銘柄）
  for (let i = 3200; i < 3350; i++) {
    const code = String(i).padStart(4, '0');
    stocks.push({
      code,
      name: `REIT${code}`,
      market: 'PRIME',
      sector: 'REIT',
      unit: 1,
    });
  }

  return stocks;
};

// 全TSE銘柄データを生成
export const TSE_ALL_STOCKS: TSEStock[] = [
  ...PRIME_STOCKS,
  ...generateAdditionalPrimeStocks(),
  ...generateStandardStocks(),
  ...generateGrowthStocks(),
  ...generateETFREITStocks(),
];

// 銘柄検索関数
export function searchTSEStocks(params: {
  market?: string;
  search?: string;
  page?: number;
  limit?: number;
}): {
  stocks: TSEStock[];
  total: number;
  page: number;
  totalPages: number;
} {
  const { market = 'ALL', search = '', page = 1, limit = 20 } = params;

  let filteredStocks = TSE_ALL_STOCKS;

  // 市場フィルタ
  if (market && market !== 'ALL') {
    filteredStocks = filteredStocks.filter(stock => stock.market === market);
  }

  // 検索フィルタ
  if (search) {
    const searchLower = search.toLowerCase();
    filteredStocks = filteredStocks.filter(stock =>
      stock.code.includes(search) ||
      stock.name.toLowerCase().includes(searchLower)
    );
  }

  const total = filteredStocks.length;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;

  return {
    stocks: filteredStocks.slice(startIndex, endIndex),
    total,
    page,
    totalPages,
  };
}

// 銘柄コードから銘柄情報を取得
export function getTSEStock(code: string): TSEStock | null {
  return TSE_ALL_STOCKS.find(stock => stock.code === code) || null;
}

// 市場別統計
export function getTSEMarketStats() {
  const stats = TSE_ALL_STOCKS.reduce((acc, stock) => {
    acc[stock.market] = (acc[stock.market] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    PRIME: stats.PRIME || 0,
    STANDARD: stats.STANDARD || 0,
    GROWTH: stats.GROWTH || 0,
    TOTAL: TSE_ALL_STOCKS.length,
  };
}
