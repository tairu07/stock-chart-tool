#!/usr/bin/env node

// 環境変数を設定
process.env.DATABASE_URL = "file:./dev.db";

import { PrismaClient } from '@prisma/client';
import { createJQuantsClient } from '../src/lib/jquants/client';
import { formatDate } from '../src/lib/utils/time';

const prisma = new PrismaClient();

interface IntradayStats {
  startTime: Date;
  endTime?: Date;
  symbolsProcessed: number;
  pricesUpdated: number;
  errors: string[];
}

async function main() {
  const stats: IntradayStats = {
    startTime: new Date(),
    symbolsProcessed: 0,
    pricesUpdated: 0,
    errors: [],
  };

  console.log('Starting intraday data update...');

  try {
    // J-Quants クライアントを初期化
    const jquants = createJQuantsClient();

    // 当日の日付
    const today = new Date();
    const dateStr = formatDate(today);

    console.log(`Target date: ${dateStr}`);

    // アクティブな銘柄リストを取得
    const symbols = await prisma.symbol.findMany({
      select: { code: true },
      orderBy: { code: 'asc' },
    });

    console.log(`Found ${symbols.length} symbols to update`);

    // 前場データを取得（11:30以降）
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    if (currentHour > 11 || (currentHour === 11 && currentMinute >= 30)) {
      console.log('Fetching morning session data...');
      
      try {
        // 前場四本値APIを使用（実際のAPIエンドポイントに応じて調整）
        const morningData = await jquants.getStockPrices({
          date: dateStr,
        });

        for (const price of morningData.daily_quotes) {
          try {
            await prisma.price.upsert({
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
                close: price.Close || 0,
                volume: price.Volume || 0,
                adjClose: price.AdjustmentClose || price.Close || 0,
                updatedAt: new Date(),
              },
              create: {
                code: price.Code,
                date: new Date(price.Date),
                open: price.Open || 0,
                high: price.High || 0,
                low: price.Low || 0,
                close: price.Close || 0,
                volume: price.Volume || 0,
                adjClose: price.AdjustmentClose || price.Close || 0,
                sourceVer: `intraday-${dateStr}`,
              },
            });

            stats.pricesUpdated++;
          } catch (error) {
            const errorMsg = `Error updating price for ${price.Code}: ${error}`;
            console.error(errorMsg);
            stats.errors.push(errorMsg);
          }
        }

        console.log(`Updated ${stats.pricesUpdated} morning session prices`);
      } catch (error) {
        const errorMsg = `Error fetching morning session data: ${error}`;
        console.error(errorMsg);
        stats.errors.push(errorMsg);
      }
    }

    // 後場データを取得（15:30以降）
    if (currentHour >= 15 && currentMinute >= 30) {
      console.log('Fetching afternoon session data...');
      
      try {
        // 日次四本値APIで最新データを取得
        const afternoonData = await jquants.getStockPrices({
          date: dateStr,
        });

        for (const price of afternoonData.daily_quotes) {
          try {
            await prisma.price.upsert({
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
                close: price.Close || 0,
                volume: price.Volume || 0,
                adjClose: price.AdjustmentClose || price.Close || 0,
                updatedAt: new Date(),
              },
              create: {
                code: price.Code,
                date: new Date(price.Date),
                open: price.Open || 0,
                high: price.High || 0,
                low: price.Low || 0,
                close: price.Close || 0,
                volume: price.Volume || 0,
                adjClose: price.AdjustmentClose || price.Close || 0,
                sourceVer: `intraday-${dateStr}`,
              },
            });

            stats.pricesUpdated++;
          } catch (error) {
            const errorMsg = `Error updating price for ${price.Code}: ${error}`;
            console.error(errorMsg);
            stats.errors.push(errorMsg);
          }
        }

        console.log(`Updated ${stats.pricesUpdated} afternoon session prices`);
      } catch (error) {
        const errorMsg = `Error fetching afternoon session data: ${error}`;
        console.error(errorMsg);
        stats.errors.push(errorMsg);
      }
    }

    // キャッシュを再検証（本番環境でのみ実行）
    if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_APP_URL) {
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
            tags: ['stock:*', 'list:*', 'meta'],
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
    }

    stats.endTime = new Date();
    const duration = stats.endTime.getTime() - stats.startTime.getTime();

    console.log('Intraday data update completed!');
    console.log(`Duration: ${Math.round(duration / 1000)}s`);
    console.log(`Symbols processed: ${stats.symbolsProcessed}`);
    console.log(`Prices updated: ${stats.pricesUpdated}`);
    console.log(`Errors: ${stats.errors.length}`);

    if (stats.errors.length > 0) {
      console.log('Errors encountered:');
      stats.errors.forEach(error => console.log(`  - ${error}`));
    }

  } catch (error) {
    console.error('Fatal error during intraday update:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// スクリプトとして実行された場合
if (require.main === module) {
  main().catch(console.error);
}

export { main as ingestIntraday };
