import { NextRequest, NextResponse } from 'next/server';
import { searchTSEStocks, getTSEMarketStats } from '@/lib/tse-stocks';
import type { StockListResponse } from '@/lib/types/api';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const market = searchParams.get('market') || 'ALL';
    const search = searchParams.get('search') || '';

    // パラメータ検証
    if (page < 1 || limit < 1 || limit > 10000) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    console.log(`Fetching stock list: page=${page}, limit=${limit}, market=${market}, search=${search}`);

    // TSE全銘柄データから検索
    const result = searchTSEStocks({
      market: market === 'all' ? 'ALL' : market.toUpperCase(),
      search,
      page,
      limit,
    });

    const response: StockListResponse = {
      stocks: result.stocks.map(stock => ({
        code: stock.code,
        name: stock.name,
        market: stock.market,
        sector: stock.sector,
        unit: stock.unit,
        listedOn: null, // 静的データのため省略
      })),
      pagination: {
        page: result.page,
        limit,
        total: result.total,
        totalPages: result.totalPages,
        hasNext: result.page < result.totalPages,
        hasPrev: result.page > 1,
      },
    };

    console.log(`Returning ${response.stocks.length} stocks out of ${result.total} total`);

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
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

// 統計情報を取得するエンドポイント
export async function POST(request: NextRequest) {
  try {
    const stats = getTSEMarketStats();
    
    return NextResponse.json({
      marketStats: stats,
      lastUpdated: new Date().toISOString(),
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
  } catch (error) {
    console.error('Error fetching market stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
