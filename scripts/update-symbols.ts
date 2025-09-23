#!/usr/bin/env node

// 環境変数を設定
process.env.DATABASE_URL = "file:./dev.db";

import { PrismaClient } from '@prisma/client';
import { createJQuantsClient } from '../src/lib/jquants/client';

const prisma = new PrismaClient();

interface SymbolStats {
  startTime: Date;
  endTime?: Date;
  symbolsAdded: number;
  symbolsUpdated: number;
  symbolsDeactivated: number;
  errors: string[];
}

async function main() {
  const stats: SymbolStats = {
    startTime: new Date(),
    symbolsAdded: 0,
    symbolsUpdated: 0,
    symbolsDeactivated: 0,
    errors: [],
  };

  console.log('Starting symbol list update...');

  try {
    // J-Quants クライアントを初期化
    const jquants = createJQuantsClient();

    // 上場銘柄一覧を取得
    console.log('Fetching listed symbols from J-Quants API...');
    const symbolsData = await jquants.getListedSymbols();

    if (!symbolsData.info || symbolsData.info.length === 0) {
      throw new Error('No symbols data received from API');
    }

    console.log(`Received ${symbolsData.info.length} symbols from API`);

    // 現在のアクティブな銘柄コードを取得
    const existingSymbols = await prisma.symbol.findMany({
      select: { code: true },
    });
    const existingCodes = new Set(existingSymbols.map(s => s.code));

    // APIから取得した銘柄コードのセット
    const apiCodes = new Set(symbolsData.info.map(s => s.Code));

    // 各銘柄を処理
    for (const symbolInfo of symbolsData.info) {
      try {
        const symbolData = {
          code: symbolInfo.Code,
          name: symbolInfo.CompanyName || '',
          market: symbolInfo.MarketCode || 'UNKNOWN',
          sector: symbolInfo.Sector33Code || null,
          unit: symbolInfo.TradingUnit || 100,
          listedOn: symbolInfo.Date ? new Date(symbolInfo.Date) : null,
        };

        if (existingCodes.has(symbolInfo.Code)) {
          // 既存銘柄の更新
          await prisma.symbol.update({
            where: { code: symbolInfo.Code },
            data: {
              ...symbolData,
              updatedAt: new Date(),
            },
          });
          stats.symbolsUpdated++;
        } else {
          // 新規銘柄の追加
          await prisma.symbol.create({
            data: symbolData,
          });
          stats.symbolsAdded++;
        }

      } catch (error) {
        const errorMsg = `Error processing symbol ${symbolInfo.Code}: ${error}`;
        console.error(errorMsg);
        stats.errors.push(errorMsg);
      }
    }

    // 上場廃止された銘柄を非アクティブ化
    const delistedCodes = [...existingCodes].filter(code => !apiCodes.has(code));
    
    if (delistedCodes.length > 0) {
      console.log(`Found ${delistedCodes.length} potentially delisted symbols`);
      
      for (const code of delistedCodes) {
        try {
          // 銘柄を削除する代わりに、非アクティブとしてマーク
          await prisma.symbol.update({
            where: { code },
            data: {
              market: 'DELISTED',
              updatedAt: new Date(),
            },
          });
          stats.symbolsDeactivated++;
        } catch (error) {
          const errorMsg = `Error deactivating symbol ${code}: ${error}`;
          console.error(errorMsg);
          stats.errors.push(errorMsg);
        }
      }
    }

    // 統計情報を更新
    const totalSymbols = await prisma.symbol.count();
    const activeSymbols = await prisma.symbol.count({
      where: {
        market: {
          not: 'DELISTED',
        },
      },
    });

    console.log('Symbol list update completed!');
    console.log(`Total symbols in database: ${totalSymbols}`);
    console.log(`Active symbols: ${activeSymbols}`);
    console.log(`Symbols added: ${stats.symbolsAdded}`);
    console.log(`Symbols updated: ${stats.symbolsUpdated}`);
    console.log(`Symbols deactivated: ${stats.symbolsDeactivated}`);

    if (stats.errors.length > 0) {
      console.log(`Errors encountered: ${stats.errors.length}`);
      stats.errors.forEach(error => console.log(`  - ${error}`));
    }

    // キャッシュを再検証（本番環境でのみ実行）
    if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_APP_URL) {
      console.log('Revalidating symbol list cache...');
      try {
        const revalidateUrl = process.env.NEXT_PUBLIC_APP_URL + '/api/revalidate';
        const response = await fetch(revalidateUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            secret: process.env.REVALIDATE_SECRET,
            tags: ['list:*', 'meta'],
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
    console.log(`Duration: ${Math.round(duration / 1000)}s`);

  } catch (error) {
    console.error('Fatal error during symbol update:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// スクリプトとして実行された場合
if (require.main === module) {
  main().catch(console.error);
}

export { main as updateSymbols };
