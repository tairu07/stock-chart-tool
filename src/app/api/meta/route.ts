import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { CACHE_TAGS } from '@/lib/cache/tags';
import type { MetaResponse } from '@/lib/types/api';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // 最新のデータセットバージョンを取得
    const latestVersion = await prisma.datasetVersion.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    // 総銘柄数を取得
    const totalSymbols = await prisma.symbol.count();

    // 市場別銘柄数を取得
    const marketCounts = await prisma.symbol.groupBy({
      by: ['market'],
      _count: {
        code: true,
      },
    });

    const markets = {
      PRIME: 0,
      STANDARD: 0,
      GROWTH: 0,
    };

    marketCounts.forEach(({ market, _count }) => {
      if (market in markets) {
        markets[market as keyof typeof markets] = _count.code;
      }
    });

    // 最新の価格データの更新日時を取得
    const latestPrice = await prisma.price.findFirst({
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true },
    });

    const response: MetaResponse = {
      lastUpdated: latestPrice?.updatedAt.toISOString() || new Date().toISOString(),
      datasetId: latestVersion?.version || 'unknown',
      totalSymbols,
      markets,
    };

    // キャッシュヘッダーを設定
    const headers = new Headers();
    headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600');

    return NextResponse.json(response, {
      headers,
      // @ts-ignore
      next: {
        tags: [CACHE_TAGS.meta],
      },
    });

  } catch (error) {
    console.error('Error fetching meta data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
