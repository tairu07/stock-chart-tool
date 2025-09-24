import { NextRequest, NextResponse } from 'next/server';
import { getTSEStock } from '@/lib/tse-stocks';
import type { StockDataResponse, Period } from '@/lib/types/api';

export const runtime = 'nodejs';

// 株価データを生成する関数
function generateStockPriceData(code: string, period: Period = '1y') {
  const stock = getTSEStock(code);
  if (!stock) {
    throw new Error(`Stock ${code} not found`);
  }

  // 期間に応じた日数を計算
  const periodDays: Record<Period, number> = {
    '1m': 30,
    '3m': 90,
    '1y': 260, // 営業日ベース
    '3y': 780,
    '5y': 1300,
  };

  const days = periodDays[period] || 260;
  
  // 基準価格（銘柄コードに基づいて設定）
  const basePrice = (parseInt(code) % 5000) + 500; // 500-5500円の範囲
  
  const prices = [];
  let currentPrice = basePrice;
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // 週末をスキップ
    if (date.getDay() === 0 || date.getDay() === 6) {
      continue;
    }
    
    // ランダムな価格変動（-3% ~ +3%）
    const change = (Math.random() - 0.5) * 0.06;
    currentPrice = Math.max(currentPrice * (1 + change), 50);
    
    const open = currentPrice * (0.98 + Math.random() * 0.04);
    const close = currentPrice;
    const high = Math.max(open, close) * (1 + Math.random() * 0.02);
    const low = Math.min(open, close) * (1 - Math.random() * 0.02);
    const volume = Math.floor(Math.random() * 5000000) + 100000;
    
    prices.push({
      t: date.toISOString(),
      o: Math.round(open * 100) / 100,
      h: Math.round(high * 100) / 100,
      l: Math.round(low * 100) / 100,
      c: Math.round(close * 100) / 100,
      v: volume,
    });
  }
  
  return prices;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const searchParams = request.nextUrl.searchParams;
    const period = (searchParams.get('period') || '1y') as Period;
    const adjusted = searchParams.get('adjusted') === 'true';

    console.log(`Fetching stock data for ${code}, period: ${period}`);

    // 銘柄の存在確認
    const stock = getTSEStock(code);
    if (!stock) {
      return NextResponse.json(
        { error: `Stock ${code} not found` },
        { status: 404 }
      );
    }

    // 株価データを生成
    const priceData = generateStockPriceData(code, period);
    
    if (priceData.length === 0) {
      return NextResponse.json(
        { error: `No price data available for ${code}` },
        { status: 404 }
      );
    }

    // 統計情報を計算
    const latestPrice = priceData[priceData.length - 1];
    const previousPrice = priceData[priceData.length - 2] || latestPrice;
    const change = latestPrice.c - previousPrice.c;
    const changePercent = previousPrice.c > 0 ? (change / previousPrice.c) * 100 : 0;
    
    const closePrices = priceData.map(p => p.c);
    const volumes = priceData.map(p => p.v);
    const high52w = Math.max(...closePrices);
    const low52w = Math.min(...closePrices);
    const avgVolume = Math.round(volumes.reduce((a, b) => a + b, 0) / volumes.length);

    const response: StockDataResponse = {
      meta: {
        code: stock.code,
        name: stock.name,
        market: stock.market,
        sector: stock.sector,
        unit: stock.unit,
        currentPrice: latestPrice.c,
        change,
        changePercent,
        high52w,
        low52w,
        volume: latestPrice.v,
        avgVolume,
        marketCap: latestPrice.c * 1000000, // 仮の発行済み株式数
        per: 15.5 + Math.random() * 10,
        pbr: 1.2 + Math.random() * 2,
        dividend: Math.round((latestPrice.c * 0.02 + Math.random() * 0.03) * 100) / 100,
        dividendYield: 2.0 + Math.random() * 3,
        updatedAt: new Date().toISOString(),
      },
      data: priceData,
      period,
      adjusted,
      dataPoints: priceData.length,
      source: 'tse-mock-data',
    };

    console.log(`Returning ${priceData.length} price points for ${code}`);

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error(`Error fetching stock data for ${code}:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
