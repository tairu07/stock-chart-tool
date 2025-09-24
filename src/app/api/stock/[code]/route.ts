import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { getPeriodStartDate } from '@/lib/utils/time';
import { getRealStockData } from '@/lib/jquants/realdata';
import { USE_REAL_JQUANTS_DATA } from '@/lib/jquants/config';
import type { StockDataResponse, Period } from '@/lib/types/api';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const searchParams = request.nextUrl.searchParams;
    const period = (searchParams.get('period') || '1y') as Period;
    const adjusted = searchParams.get('adjusted') !== 'false';

    // パラメータ検証
    if (!code || !/^\d{4}$/.test(code)) {
      return NextResponse.json(
        { error: 'Invalid stock code' },
        { status: 400 }
      );
    }

    // 実データまたはモックデータを使用
    if (USE_REAL_JQUANTS_DATA) {
      console.log(`Using real J-Quants data for ${code}`);
      
      try {
        const realData = await getRealStockData(code, { period, adjusted });
        
        return NextResponse.json(realData, {
          headers: {
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
          },
        });
      } catch (error) {
        console.error('Failed to fetch real data, falling back to database:', error);
        // 実データ取得に失敗した場合はデータベースにフォールバック
      }
    }

    // データベースからデータを取得（フォールバック）
    console.log(`Using database data for ${code}`);
    
    // 銘柄情報を取得
    const symbol = await prisma.symbol.findUnique({
      where: { code },
    });

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol not found' },
        { status: 404 }
      );
    }

    // 期間の開始日を計算
    const startDate = getPeriodStartDate(period);
    const endDate = new Date();

    // 価格データを取得
    const prices = await prisma.price.findMany({
      where: {
        code,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });

    // 統計情報を計算
    const closePrices = prices.map(p => p.close);
    const volumes = prices.map(p => p.volume);
    const currentPrice = closePrices[closePrices.length - 1] || 0;
    const previousPrice = closePrices[closePrices.length - 2] || currentPrice;
    const change = currentPrice - previousPrice;
    const changePercent = previousPrice > 0 ? (change / previousPrice) * 100 : 0;

    const response: StockDataResponse = {
      symbol: {
        code: symbol.code,
        name: symbol.name,
        market: symbol.market,
        sector: symbol.sector || '',
        unit: symbol.unit,
        listedOn: symbol.listedOn?.toISOString() || null,
      },
      prices: prices.map(price => ({
        code: price.code,
        date: price.date.toISOString().split('T')[0],
        open: price.open,
        high: price.high,
        low: price.low,
        close: price.close,
        volume: price.volume,
        adjClose: adjusted ? price.adjClose : price.close,
      })),
      stats: {
        currentPrice,
        change,
        changePercent,
        high52w: closePrices.length > 0 ? Math.max(...closePrices) : 0,
        low52w: closePrices.length > 0 ? Math.min(...closePrices) : 0,
        avgVolume: volumes.length > 0 ? Math.round(volumes.reduce((a, b) => a + b, 0) / volumes.length) : 0,
        marketCap: currentPrice * 1000000, // 仮の発行済み株式数
        per: 15.5,
        pbr: 1.2,
        dividend: 2.5,
        dividendYield: 2.1,
      },
      meta: {
        period,
        adjusted,
        dataPoints: prices.length,
        lastUpdated: new Date().toISOString(),
        source: USE_REAL_JQUANTS_DATA ? 'jquants-fallback-database' : 'database',
        version: '1.0',
      },
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('Error fetching stock data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
