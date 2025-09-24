import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// TSE全銘柄のモックデータ
const TSE_STOCKS = [
  // プライム市場（約1,800銘柄）
  ...Array.from({ length: 1800 }, (_, i) => {
    const code = String(1000 + i).padStart(4, '0');
    return {
      code,
      name: `プライム銘柄${code}`,
      market: 'PRIME',
      sector: getSector(i),
      unit: getUnit(i),
      listedOn: getRandomDate(new Date('2000-01-01'), new Date('2023-12-31')),
    };
  }),
  
  // スタンダード市場（約1,400銘柄）
  ...Array.from({ length: 1400 }, (_, i) => {
    const code = String(3000 + i).padStart(4, '0');
    return {
      code,
      name: `スタンダード銘柄${code}`,
      market: 'STANDARD',
      sector: getSector(i),
      unit: getUnit(i),
      listedOn: getRandomDate(new Date('2000-01-01'), new Date('2023-12-31')),
    };
  }),
  
  // グロース市場（約500銘柄）
  ...Array.from({ length: 500 }, (_, i) => {
    const code = String(5000 + i).padStart(4, '0');
    return {
      code,
      name: `グロース銘柄${code}`,
      market: 'GROWTH',
      sector: getSector(i),
      unit: getUnit(i),
      listedOn: getRandomDate(new Date('2010-01-01'), new Date('2023-12-31')),
    };
  }),
  
  // ETF・REIT（約300銘柄）
  ...Array.from({ length: 300 }, (_, i) => {
    const code = String(1300 + i).padStart(4, '0');
    return {
      code,
      name: i < 150 ? `ETF${code}` : `REIT${code}`,
      market: 'PRIME',
      sector: i < 150 ? 'ETF' : 'REIT',
      unit: 1,
      listedOn: getRandomDate(new Date('2005-01-01'), new Date('2023-12-31')),
    };
  }),
];

// セクター分類
function getSector(index: number): string {
  const sectors = [
    '水産・農林業',
    '鉱業',
    '建設業',
    '食料品',
    '繊維製品',
    'パルプ・紙',
    '化学',
    '医薬品',
    '石油・石炭製品',
    'ゴム製品',
    'ガラス・土石製品',
    '鉄鋼',
    '非鉄金属',
    '金属製品',
    '機械',
    '電気機器',
    '輸送用機器',
    '精密機器',
    'その他製品',
    '電気・ガス業',
    '陸運業',
    '海運業',
    '空運業',
    '倉庫・運輸関連業',
    '情報・通信業',
    '卸売業',
    '小売業',
    '銀行業',
    '証券・商品先物取引業',
    '保険業',
    'その他金融業',
    '不動産業',
    'サービス業',
  ];
  return sectors[index % sectors.length];
}

// 売買単位
function getUnit(index: number): number {
  const units = [1, 10, 100, 1000];
  return units[index % units.length];
}

// ランダムな日付を生成
function getRandomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// 株価データを生成
function generatePriceData(code: string, days: number = 1000) {
  const prices = [];
  const basePrice = (parseInt(code) % 5000) + 500; // 500-5500円の範囲
  let currentPrice = basePrice;
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // 週末をスキップ
    if (date.getDay() === 0 || date.getDay() === 6) {
      continue;
    }
    
    // ランダムな価格変動（-5% ~ +5%）
    const change = (Math.random() - 0.5) * 0.1;
    currentPrice = Math.max(currentPrice * (1 + change), 50);
    
    const open = currentPrice * (0.98 + Math.random() * 0.04);
    const close = currentPrice;
    const high = Math.max(open, close) * (1 + Math.random() * 0.03);
    const low = Math.min(open, close) * (1 - Math.random() * 0.03);
    const volume = Math.floor(Math.random() * 10000000) + 100000;
    
    prices.push({
      code,
      date,
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume,
      adjClose: Math.round(close * 100) / 100,
    });
  }
  
  return prices;
}

async function main() {
  console.log('TSE全銘柄データの生成を開始します...');
  
  try {
    // 既存データをクリア
    console.log('既存データをクリアしています...');
    await prisma.price.deleteMany();
    await prisma.symbol.deleteMany();
    
    // 銘柄データを挿入
    console.log(`${TSE_STOCKS.length}銘柄の銘柄データを挿入しています...`);
    
    // バッチ処理で挿入（100件ずつ）
    const batchSize = 100;
    for (let i = 0; i < TSE_STOCKS.length; i += batchSize) {
      const batch = TSE_STOCKS.slice(i, i + batchSize);
      await prisma.symbol.createMany({
        data: batch,
        skipDuplicates: true,
      });
      console.log(`銘柄データ: ${i + batch.length}/${TSE_STOCKS.length} 完了`);
    }
    
    // 株価データを生成（サンプルとして最初の100銘柄のみ）
    console.log('株価データを生成しています（最初の100銘柄）...');
    
    for (let i = 0; i < Math.min(100, TSE_STOCKS.length); i++) {
      const stock = TSE_STOCKS[i];
      const priceData = generatePriceData(stock.code, 1000);
      
      // バッチ処理で価格データを挿入
      const priceBatchSize = 500;
      for (let j = 0; j < priceData.length; j += priceBatchSize) {
        const priceBatch = priceData.slice(j, j + priceBatchSize);
        await prisma.price.createMany({
          data: priceBatch,
          skipDuplicates: true,
        });
      }
      
      console.log(`株価データ: ${i + 1}/100 完了 (${stock.code})`);
    }
    
    // 統計情報を表示
    const symbolCount = await prisma.symbol.count();
    const priceCount = await prisma.price.count();
    
    console.log('\n=== データ生成完了 ===');
    console.log(`銘柄数: ${symbolCount.toLocaleString()}`);
    console.log(`株価データ数: ${priceCount.toLocaleString()}`);
    
    // 市場別統計
    const marketStats = await prisma.symbol.groupBy({
      by: ['market'],
      _count: { code: true },
    });
    
    console.log('\n=== 市場別統計 ===');
    marketStats.forEach(stat => {
      console.log(`${stat.market}: ${stat._count.code.toLocaleString()}銘柄`);
    });
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main()
    .then(() => {
      console.log('TSE全銘柄データの生成が完了しました！');
      process.exit(0);
    })
    .catch((error) => {
      console.error('データ生成に失敗しました:', error);
      process.exit(1);
    });
}

export { main as generateTSEStocks };
