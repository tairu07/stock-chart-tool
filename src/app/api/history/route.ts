import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { CACHE_TAGS } from '@/lib/cache/tags';
import type { HistoryResponse } from '@/lib/types/api';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const since = searchParams.get('since');
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 1000);

    // 検索条件を構築
    const where: any = {
      kind: 'history',
    };

    if (since) {
      const sinceDate = new Date(since);
      if (!isNaN(sinceDate.getTime())) {
        where.createdAt = { gte: sinceDate };
      }
    }

    // 履歴を取得
    const historyMarks = await prisma.mark.findMany({
      where,
      include: {
        symbol: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // レスポンス形式に変換
    const data = historyMarks.map(mark => {
      let payload: any = {};
      try {
        payload = mark.payload ? JSON.parse(mark.payload) : {};
      } catch (e) {
        // JSON パースに失敗した場合はそのまま使用
        payload = { raw: mark.payload };
      }

      return {
        code: mark.code,
        name: mark.symbol.name,
        viewedAt: mark.createdAt.toISOString(),
        action: payload.action || 'view',
        details: payload,
      };
    });

    const response: HistoryResponse = { data };

    // キャッシュヘッダーを設定
    const headers = new Headers();
    headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');

    return NextResponse.json(response, {
      headers,
      // @ts-ignore
      next: {
        tags: [CACHE_TAGS.history],
      },
    });

  } catch (error) {
    console.error('Error fetching history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, action = 'view', details = {} } = body;

    // パラメータ検証
    if (!code || !/^\d{4,5}$/.test(code)) {
      return NextResponse.json(
        { error: 'Invalid stock code' },
        { status: 400 }
      );
    }

    // 銘柄の存在確認
    const symbol = await prisma.symbol.findUnique({
      where: { code },
    });

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol not found' },
        { status: 404 }
      );
    }

    // 履歴を記録
    const historyMark = await prisma.mark.create({
      data: {
        code,
        kind: 'history',
        payload: JSON.stringify({
          action,
          timestamp: new Date().toISOString(),
          ...details,
        }),
      },
    });

    return NextResponse.json({
      id: historyMark.id,
      code: historyMark.code,
      action,
      timestamp: historyMark.createdAt.toISOString(),
    });

  } catch (error) {
    console.error('Error creating history entry:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
