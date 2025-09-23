#!/usr/bin/env node

// 環境変数を設定
process.env.DATABASE_URL = "file:./dev.db";

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface MaintenanceStats {
  startTime: Date;
  endTime?: Date;
  oldPricesDeleted: number;
  oldMarksDeleted: number;
  oldHistoryDeleted: number;
  errors: string[];
}

async function main() {
  const stats: MaintenanceStats = {
    startTime: new Date(),
    oldPricesDeleted: 0,
    oldMarksDeleted: 0,
    oldHistoryDeleted: 0,
    errors: [],
  };

  console.log('Starting database maintenance...');

  try {
    // 古い価格データを削除（5年以上前）
    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);

    console.log(`Deleting price data older than ${fiveYearsAgo.toISOString().split('T')[0]}...`);
    
    const deletedPrices = await prisma.price.deleteMany({
      where: {
        date: {
          lt: fiveYearsAgo,
        },
      },
    });
    
    stats.oldPricesDeleted = deletedPrices.count;
    console.log(`Deleted ${stats.oldPricesDeleted} old price records`);

    // 古いマークを削除（1年以上前のnoteとtag）
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    console.log(`Deleting old marks (note/tag) older than ${oneYearAgo.toISOString().split('T')[0]}...`);
    
    const deletedMarks = await prisma.mark.deleteMany({
      where: {
        AND: [
          {
            kind: {
              in: ['note', 'tag'],
            },
          },
          {
            createdAt: {
              lt: oneYearAgo,
            },
          },
        ],
      },
    });
    
    stats.oldMarksDeleted = deletedMarks.count;
    console.log(`Deleted ${stats.oldMarksDeleted} old mark records`);

    // 古い履歴を削除（3ヶ月以上前）
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    console.log(`Deleting history older than ${threeMonthsAgo.toISOString().split('T')[0]}...`);
    
    try {
      const deletedHistory = await prisma.mark.deleteMany({
        where: {
          AND: [
            {
              kind: 'history',
            },
            {
              createdAt: {
                lt: threeMonthsAgo,
              },
            },
          ],
        },
      });
      
      stats.oldHistoryDeleted = deletedHistory.count;
      console.log(`Deleted ${stats.oldHistoryDeleted} old history records`);
    } catch (error) {
      console.log('History table not found, skipping history cleanup');
      stats.oldHistoryDeleted = 0;
    }

    // データベース統計を表示
    const symbolCount = await prisma.symbol.count();
    const priceCount = await prisma.price.count();
    const markCount = await prisma.mark.count();
    
    let historyCount = 0;
    try {
      historyCount = await prisma.mark.count({
        where: { kind: 'history' }
      });
    } catch (error) {
      // History table not found
    }

    console.log('\nDatabase statistics after maintenance:');
    console.log(`Symbols: ${symbolCount}`);
    console.log(`Prices: ${priceCount}`);
    console.log(`Marks: ${markCount}`);
    console.log(`History: ${historyCount}`);

    // データベースの最適化（SQLiteの場合）
    if (process.env.DATABASE_URL?.includes('sqlite') || process.env.DATABASE_URL?.includes('file:')) {
      console.log('\nOptimizing SQLite database...');
      try {
        await prisma.$executeRaw`VACUUM`;
        await prisma.$executeRaw`ANALYZE`;
        console.log('Database optimization completed');
      } catch (error) {
        const errorMsg = `Error during database optimization: ${error}`;
        console.error(errorMsg);
        stats.errors.push(errorMsg);
      }
    }

    stats.endTime = new Date();
    const duration = stats.endTime.getTime() - stats.startTime.getTime();

    console.log('\nDatabase maintenance completed!');
    console.log(`Duration: ${Math.round(duration / 1000)}s`);
    console.log(`Old prices deleted: ${stats.oldPricesDeleted}`);
    console.log(`Old marks deleted: ${stats.oldMarksDeleted}`);
    console.log(`Old history deleted: ${stats.oldHistoryDeleted}`);

    if (stats.errors.length > 0) {
      console.log(`Errors encountered: ${stats.errors.length}`);
      stats.errors.forEach(error => console.log(`  - ${error}`));
    }

  } catch (error) {
    console.error('Fatal error during maintenance:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// スクリプトとして実行された場合
if (require.main === module) {
  main().catch(console.error);
}

export { main as runMaintenance };
