#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';
import { createJQuantsClient } from '../src/lib/jquants/client';
import { EOD_REVALIDATE_TAGS } from '../src/lib/cache/tags';
import { formatDate } from '../src/lib/utils/time';

const prisma = new PrismaClient();

interface IngestStats {
  startTime: Date;
  endTime?: Date;
  symbolsProcessed: number;
  pricesInserted: number;
  pricesUpdated: number;
  errors: string[];
}

async function main() {
  const stats: IngestStats = {
    startTime: new Date(),
    symbolsProcessed: 0,
    pricesInserted: 0,
    pricesUpdated: 0,
    errors: [],
  };

  console.log('Starting EOD data ingestion...');

  try {
    // J-Quants クライアントを初期化
    const jquants = createJQuantsClient();

    // 対象日付（前営業日）
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - 1);
    const dateStr = formatDate(targetDate);

    console.log(`Target date: ${dateStr}`);

    // データセットバージョンを作成
    const datasetVersion = await prisma.datasetVersion.create({
      data: {
        version: `eod-${dateStr}-${Date.now()}`,
        description: `EOD data for ${dateStr}`,
        isActive: false,
      },
    });

    console.log(`Created dataset version: ${datasetVersion.version}`);

    // 銘柄情報を更新
    console.log('Updating symbol information...');
    const symbolsData = await jquants.getAllSymbolInfo(dateStr);
    
    for (const symbolInfo of symbolsData) {
      try {
        // 市場区分をマッピング
        let market = 'STANDARD';
        if (symbolInfo.MarketCodeName.includes('プライム')) {
          market = 'PRIME';
        } else if (symbolInfo.MarketCodeName.includes('グロース')) {
          market = 'GROWTH';
        }

        await prisma.symbol.upsert({
          where: { code: symbolInfo.Code },
          update: {
            name: symbolInfo.CompanyName,
            market,
            sector: symbolInfo.Sector33CodeName,
            updatedAt: new Date(),
          },
          create: {
            code: symbolInfo.Code,
            name: symbolInfo.CompanyName,
            market,
            sector: symbolInfo.Sector33CodeName,
            listedOn: new Date(symbolInfo.Date),
          },
        });

        stats.symbolsProcessed++;
      } catch (error) {
        const errorMsg = `Error processing symbol ${symbolInfo.Code}: ${error}`;
        console.error(errorMsg);
        stats.errors.push(errorMsg);
      }
    }

    console.log(`Processed ${stats.symbolsProcessed} symbols`);

    // 株価データを取得・更新
    console.log('Fetching stock prices...');
    const pricesData = await jquants.getAllStockPrices(dateStr);

    console.log(`Fetched ${pricesData.length} price records`);

    // バッチでデータベースに挿入
    const batchSize = 1000;
    for (let i = 0; i < pricesData.length; i += batchSize) {
      const batch = pricesData.slice(i, i + batchSize);
      
      try {
        const operations = batch.map(price => {
          if (!price.Close || !price.AdjustmentClose) {
            return null; // 無効なデータをスキップ
          }

          return prisma.price.upsert({
            where: {
              code_date: {
                code: price.Code,
                date: new Date(price.Date),
              },
            },
            update: {
              open: price.Open || 0,
              high: price.High || 0,
              low: price.Low || 0,
              close: price.Close,
              volume: price.Volume || 0,
              adjClose: price.AdjustmentClose,
              sourceVer: datasetVersion.version,
              updatedAt: new Date(),
            },
            create: {
              code: price.Code,
              date: new Date(price.Date),
              open: price.Open || 0,
              high: price.High || 0,
              low: price.Low || 0,
              close: price.Close,
              volume: price.Volume || 0,
              adjClose: price.AdjustmentClose,
              sourceVer: datasetVersion.version,
            },
          });
        }).filter(Boolean);

        await prisma.$transaction(operations);
        
        stats.pricesInserted += operations.length;
        console.log(`Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(pricesData.length / batchSize)}`);

      } catch (error) {
        const errorMsg = `Error processing batch ${i}-${i + batchSize}: ${error}`;
        console.error(errorMsg);
        stats.errors.push(errorMsg);
      }
    }

    // データセットバージョンをアクティブに設定
    await prisma.datasetVersion.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    await prisma.datasetVersion.update({
      where: { id: datasetVersion.id },
      data: { isActive: true },
    });

    console.log('Dataset version activated');

    // キャッシュを再検証
    console.log('Revalidating cache...');
    try {
      const revalidateUrl = process.env.NEXT_PUBLIC_APP_URL + '/api/revalidate';
      const response = await fetch(revalidateUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          secret: process.env.REVALIDATE_SECRET,
          tags: EOD_REVALIDATE_TAGS,
        }),
      });

      if (response.ok) {
        console.log('Cache revalidation successful');
      } else {
        console.error('Cache revalidation failed:', await response.text());
      }
    } catch (error) {
      console.error('Error during cache revalidation:', error);
    }

    stats.endTime = new Date();
    const duration = stats.endTime.getTime() - stats.startTime.getTime();

    console.log('EOD data ingestion completed successfully!');
    console.log(`Duration: ${Math.round(duration / 1000)}s`);
    console.log(`Symbols processed: ${stats.symbolsProcessed}`);
    console.log(`Prices inserted/updated: ${stats.pricesInserted}`);
    console.log(`Errors: ${stats.errors.length}`);

    if (stats.errors.length > 0) {
      console.log('Errors encountered:');
      stats.errors.forEach(error => console.log(`  - ${error}`));
    }

  } catch (error) {
    console.error('Fatal error during EOD ingestion:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// スクリプトとして実行された場合
if (require.main === module) {
  main().catch(console.error);
}

export { main as ingestEOD };
