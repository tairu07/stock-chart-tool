import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { CACHE_TAGS } from '@/lib/cache/tags';
import type { MarksResponse, CreateMarkRequest } from '@/lib/types/api';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const kind = searchParams.get('kind');

    // 検索条件を構築
    const where: any = {};
    if (code) where.code = code;
    if (kind) where.kind = kind;

    // マークを取得
    const marks = await prisma.mark.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 1000, // 最大1000件
    });

    const response: MarksResponse = {
      data: marks.map(mark => ({
        id: mark.id,
        code: mark.code,
        kind: mark.kind as any,
        payload: mark.payload,
        createdAt: mark.createdAt.toISOString(),
        updatedAt: mark.updatedAt.toISOString(),
      })),
    };

    // キャッシュヘッダーを設定
    const headers = new Headers();
    headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');

    return NextResponse.json(response, {
      headers,
      // @ts-ignore
      next: {
        tags: [CACHE_TAGS.marks(code || undefined)],
      },
    });

  } catch (error) {
    console.error('Error fetching marks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateMarkRequest = await request.json();
    const { code, kind, payload } = body;

    // パラメータ検証
    if (!code || !/^\d{4,5}$/.test(code)) {
      return NextResponse.json(
        { error: 'Invalid stock code' },
        { status: 400 }
      );
    }

    const validKinds = ['star', 'skip', 'tag', 'note'];
    if (!validKinds.includes(kind)) {
      return NextResponse.json(
        { error: 'Invalid mark kind' },
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

    // 既存のマークをチェック（star/skipは重複不可）
    if (kind === 'star' || kind === 'skip') {
      const existingMark = await prisma.mark.findFirst({
        where: { code, kind },
      });

      if (existingMark) {
        // 既存のマークを削除
        await prisma.mark.delete({
          where: { id: existingMark.id },
        });
      }
    }

    // 新しいマークを作成
    const mark = await prisma.mark.create({
      data: {
        code,
        kind,
        payload,
      },
    });

    // 履歴にも記録
    await prisma.mark.create({
      data: {
        code,
        kind: 'history',
        payload: JSON.stringify({
          action: 'mark',
          markKind: kind,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    return NextResponse.json({
      id: mark.id,
      code: mark.code,
      kind: mark.kind,
      payload: mark.payload,
      createdAt: mark.createdAt.toISOString(),
      updatedAt: mark.updatedAt.toISOString(),
    });

  } catch (error) {
    console.error('Error creating mark:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const code = searchParams.get('code');
    const kind = searchParams.get('kind');

    if (id) {
      // IDで削除
      await prisma.mark.delete({
        where: { id },
      });
    } else if (code && kind) {
      // コードと種類で削除
      await prisma.mark.deleteMany({
        where: { code, kind },
      });
    } else {
      return NextResponse.json(
        { error: 'ID or code+kind is required' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting mark:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
