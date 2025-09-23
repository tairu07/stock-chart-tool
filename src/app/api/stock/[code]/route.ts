import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { CACHE_TAGS } from '@/lib/cache/tags';
import { getPeriodStartDate } from '@/lib/utils/time';
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
    const fields = searchParams.get('fields') || 'ohlcv';

    // パラメータ検証
    if (!code || !/^\d{4,5}$/.test(code)) {
      return NextResponse.json(
        { error: 'Invalid stock code' },
        { status: 400 }
      );
    }

    const validPeriods: Period[] = ['1m', '3m', '1y', '3y', '5y'];
    if (!validPeriods.includes(period)) {
      return NextResponse.json(
        { error: 'Invalid period' },
        { status: 400 }
      );
    }

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
    const endDate = new Date();
    const startDate = getPeriodStartDate(period, endDate);

    // 株価データを取得
    const prices = await prisma.price.findMany({
      where: {
        code,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    // レスポンス形式に変換
    const data = prices.map(price => ({
      t: price.date.toISOString(),
      o: adjusted ? price.adjClose * (price.open / price.close) : price.open,
      h: adjusted ? price.adjClose * (price.high / price.close) : price.high,
      l: adjusted ? price.adjClose * (price.low / price.close) : price.low,
      c: adjusted ? price.adjClose : price.close,
      v: price.volume,
    }));

    // 最新のデータセットバージョンを取得
    const latestVersion = await prisma.datasetVersion.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    const response: StockDataResponse = {
      meta: {
        updatedAt: latestVersion?.updatedAt.toISOString() || new Date().toISOString(),
        datasetId: latestVersion?.version || 'unknown',
        code: symbol.code,
        name: symbol.name,
        market: symbol.market,
        period,
      },
      data,
    };

    // キャッシュヘッダーを設定
    const headers = new Headers();
    headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=86400');
    headers.set('ETag', `"${symbol.code}-${period}-${latestVersion?.version || 'unknown'}"`);

    return NextResponse.json(response, {
      headers,
      // Next.js のキャッシュタグを設定
      // @ts-ignore
      next: {
        tags: [CACHE_TAGS.stock(code, period)],
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
