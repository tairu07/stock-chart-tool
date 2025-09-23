#!/usr/bin/env node

// 環境変数を設定
process.env.DATABASE_URL = "file:./dev.db";

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// サンプル銘柄データ
const sampleSymbols = [
  { code: '7203', name: 'トヨタ自動車', market: 'PRIME', sector: '輸送用機器' },
  { code: '6758', name: 'ソニーグループ', market: 'PRIME', sector: '電気機器' },
  { code: '9984', name: 'ソフトバンクグループ', market: 'PRIME', sector: '情報・通信業' },
  { code: '6861', name: 'キーエンス', market: 'PRIME', sector: '電気機器' },
  { code: '4063', name: '信越化学工業', market: 'PRIME', sector: '化学' },
  { code: '8306', name: '三菱UFJフィナンシャル・グループ', market: 'PRIME', sector: '銀行業' },
  { code: '6098', name: 'リクルートホールディングス', market: 'PRIME', sector: 'サービス業' },
  { code: '4519', name: '中外製薬', market: 'PRIME', sector: '医薬品' },
  { code: '9432', name: '日本電信電話', market: 'PRIME', sector: '情報・通信業' },
  { code: '8035', name: '東京エレクトロン', market: 'PRIME', sector: '電気機器' },
];

// 株価データを生成する関数
function generatePriceData(basePrice: number, days: number) {
  const prices = [];
  let currentPrice = basePrice;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    // 土日をスキップ
    if (date.getDay() === 0 || date.getDay() === 6) {
      continue;
    }

    // ランダムな変動を生成
    const change = (Math.random() - 0.5) * 0.1; // ±5%の変動
    const newPrice = currentPrice * (1 + change);
    
    const open = currentPrice;
    const close = newPrice;
    const high = Math.max(open, close) * (1 + Math.random() * 0.02);
    const low = Math.min(open, close) * (1 - Math.random() * 0.02);
    const volume = Math.floor(Math.random() * 1000000) + 100000;

    prices.push({
      date,
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      adjClose: Math.round(close * 100) / 100,
      volume,
    });

    currentPrice = newPrice;
  }

  return prices;
}

async function main() {
  console.log('Creating sample data...');

  try {
    // データセットバージョンを作成
    const datasetVersion = await prisma.datasetVersion.create({
      data: {
        version: `sample-${Date.now()}`,
        description: 'Sample data for development',
        isActive: true,
      },
    });

    console.log(`Created dataset version: ${datasetVersion.version}`);

    // サンプル銘柄を作成
    for (const symbolData of sampleSymbols) {
      console.log(`Creating symbol: ${symbolData.code} - ${symbolData.name}`);

      // 銘柄を作成
      await prisma.symbol.upsert({
        where: { code: symbolData.code },
        update: {
          name: symbolData.name,
          market: symbolData.market,
          sector: symbolData.sector,
        },
        create: {
          code: symbolData.code,
          name: symbolData.name,
          market: symbolData.market,
          sector: symbolData.sector,
          unit: 100,
          listedOn: new Date('2000-01-01'),
        },
      });

      // 株価データを生成（過去1年分）
      const basePrice = Math.random() * 5000 + 1000; // 1000-6000円の範囲
      const priceData = generatePriceData(basePrice, 365);

      // 株価データを挿入
      for (const price of priceData) {
        await prisma.price.upsert({
          where: {
            code_date: {
              code: symbolData.code,
              date: price.date,
            },
          },
          update: {
            open: price.open,
            high: price.high,
            low: price.low,
            close: price.close,
            adjClose: price.adjClose,
            volume: price.volume,
            sourceVer: datasetVersion.version,
          },
          create: {
            code: symbolData.code,
            date: price.date,
            open: price.open,
            high: price.high,
            low: price.low,
            close: price.close,
            adjClose: price.adjClose,
            volume: price.volume,
            sourceVer: datasetVersion.version,
          },
        });
      }

      console.log(`  Created ${priceData.length} price records`);
    }

    console.log('Sample data creation completed successfully!');

  } catch (error) {
    console.error('Error creating sample data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// スクリプトとして実行された場合
if (require.main === module) {
  main().catch(console.error);
}

export { main as seedSampleData };
