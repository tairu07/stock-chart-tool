import { NextResponse } from 'next/server';
import { getRealStockList } from '@/lib/jquants/realdata';
import { USE_REAL_JQUANTS_DATA } from '@/lib/jquants/config';
import { prisma } from '@/lib/db/client';

export const runtime = 'nodejs';

export async function GET() {
  try {
    console.log('Testing navigation with full stock list...');
    
    let totalStocks = 0;
    let sampleCodes: string[] = [];
    let source = '';
    
    if (USE_REAL_JQUANTS_DATA) {
      try {
        console.log('Fetching from J-Quants API...');
        const realData = await getRealStockList({ limit: 5000 });
        totalStocks = realData.stocks.length;
        sampleCodes = realData.stocks.slice(0, 10).map(s => s.code);
        source = 'jquants';
      } catch (error) {
        console.error('J-Quants API failed, using database:', error);
        // フォールバック
        const dbStocks = await prisma.symbol.findMany({
          select: { code: true },
          take: 5000,
        });
        totalStocks = dbStocks.length;
        sampleCodes = dbStocks.slice(0, 10).map(s => s.code);
        source = 'database';
      }
    } else {
      const dbStocks = await prisma.symbol.findMany({
        select: { code: true },
        take: 5000,
      });
      totalStocks = dbStocks.length;
      sampleCodes = dbStocks.slice(0, 10).map(s => s.code);
      source = 'database';
    }
    
    return NextResponse.json({
      success: true,
      navigation: {
        totalStocks,
        source,
        sampleCodes,
        canNavigate: totalStocks > 0,
        estimatedNavigationTime: `${Math.round(totalStocks * 3 / 60)} minutes at 3 seconds per stock`,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error testing navigation:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
