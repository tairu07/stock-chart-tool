import { NextResponse } from 'next/server';
import { testJQuantsConnection } from '@/lib/jquants/realdata';
import { JQUANTS_CONFIG } from '@/lib/jquants/config';

export const runtime = 'nodejs';

export async function GET() {
  try {
    console.log('Testing J-Quants API connection...');
    
    // 設定確認
    const hasRefreshToken = !!JQUANTS_CONFIG.refreshToken;
    const refreshTokenLength = JQUANTS_CONFIG.refreshToken.length;
    
    console.log(`Refresh token available: ${hasRefreshToken}`);
    console.log(`Refresh token length: ${refreshTokenLength}`);
    
    if (!hasRefreshToken) {
      return NextResponse.json({
        success: false,
        error: 'No refresh token configured',
        config: {
          hasRefreshToken: false,
          baseUrl: JQUANTS_CONFIG.baseUrl,
        }
      });
    }
    
    // 実際のAPI接続テスト
    const connectionSuccess = await testJQuantsConnection();
    
    return NextResponse.json({
      success: connectionSuccess,
      message: connectionSuccess 
        ? 'J-Quants API connection successful' 
        : 'J-Quants API connection failed',
      config: {
        hasRefreshToken: true,
        refreshTokenLength,
        baseUrl: JQUANTS_CONFIG.baseUrl,
        useRealData: JQUANTS_CONFIG.useRealData,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error testing J-Quants connection:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
