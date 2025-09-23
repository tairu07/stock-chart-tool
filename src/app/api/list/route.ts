import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { CACHE_TAGS } from '@/lib/cache/tags';
import type { StockListResponse, Market } from '@/lib/types/api';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const market = (searchParams.get('market') || 'ALL') as Market;
    const q = searchParams.get('q') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const size = Math.min(parseInt(searchParams.get('size') || '50'), 1000);

    // パラメータ検証
    const validMarkets: Market[] = ['ALL', 'PRIME', 'STANDARD', 'GROWTH'];
    if (!validMarkets.includes(market)) {
      return NextResponse.json(
        { error: 'Invalid market' },
        { status: 400 }
      );
    }

    if (page < 1 || size < 1) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    // 検索条件を構築
    const where: any = {};

    // 市場フィルタ
    if (market !== 'ALL') {
      where.market = market;
    }

    // 検索クエリ
    if (q) {
      where.OR = [
        { code: { contains: q } },
        { name: { contains: q } },
      ];
    }

    // 総件数を取得
    const total = await prisma.symbol.count({ where });

    // データを取得
    const symbols = await prisma.symbol.findMany({
      where,
      select: {
        code: true,
        name: true,
        market: true,
        sector: true,
        unit: true,
        listedOn: true,
        updatedAt: true,
      },
      orderBy: [
        { market: 'asc' },
        { code: 'asc' },
      ],
      skip: (page - 1) * size,
      take: size,
    });

    // 最新の株価情報を取得（現在値など）
    const codesWithPrices = await Promise.all(
      symbols.map(async (symbol) => {
        const latestPrice = await prisma.price.findFirst({
          where: { code: symbol.code },
          orderBy: { date: 'desc' },
        });

        const previousPrice = await prisma.price.findFirst({
          where: { 
            code: symbol.code,
            date: { lt: latestPrice?.date || new Date() }
          },
          orderBy: { date: 'desc' },
        });

        const currentPrice = latestPrice?.adjClose || 0;
        const previousClose = previousPrice?.adjClose || currentPrice;
        const change = currentPrice - previousClose;
        const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;

        return {
          code: symbol.code,
          name: symbol.name,
          market: symbol.market,
          sector: symbol.sector,
          unit: symbol.unit,
          listedOn: symbol.listedOn?.toISOString(),
          currentPrice: currentPrice > 0 ? currentPrice : undefined,
          previousClose: previousClose > 0 ? previousClose : undefined,
          change: Math.abs(change) > 0.01 ? change : undefined,
          changePercent: Math.abs(changePercent) > 0.01 ? changePercent : undefined,
          dayHigh: latestPrice?.high,
          dayLow: latestPrice?.low,
          volume: latestPrice?.volume,
          lastUpdated: latestPrice?.date.toISOString(),
        };
      })
    );

    const totalPages = Math.ceil(total / size);

    const response: StockListResponse = {
      data: codesWithPrices,
      pagination: {
        page,
        size,
        total,
        totalPages,
      },
    };

    // キャッシュヘッダーを設定
    const headers = new Headers();
    headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600');
    
    return NextResponse.json(response, {
      headers,
      // @ts-ignore
      next: {
        tags: [CACHE_TAGS.list(market)],
      },
    });

  } catch (error) {
    console.error('Error fetching stock list:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
