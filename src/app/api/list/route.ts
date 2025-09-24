import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { getRealStockList } from '@/lib/jquants/realdata';
import { getFallbackStockList } from '@/lib/jquants/fallback';
import { USE_REAL_JQUANTS_DATA } from '@/lib/jquants/config';
import type { StockListResponse } from '@/lib/types/api';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const market = searchParams.get('market');
    const search = searchParams.get('search');

    // パラメータ検証（全銘柄取得対応）
    if (page < 1 || limit < 1 || limit > 10000) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    // 実データまたはフォールバックデータを使用
    if (USE_REAL_JQUANTS_DATA) {
      console.log('Attempting to use real J-Quants data for stock list');
      
      try {
        const realData = await getRealStockList({ page, limit, market, search });
        
        return NextResponse.json(realData, {
          headers: {
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          },
        });
      } catch (error) {
        console.error('J-Quants API failed, using database fallback:', error);
        // 実データ取得に失敗した場合はフォールバックを使用
      }
    }

    // フォールバック関数を使用
    console.log('Using fallback stock list from database');
    
    const fallbackData = await getFallbackStockList({ page, limit, market, search });
    
    return NextResponse.json(fallbackData, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
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
