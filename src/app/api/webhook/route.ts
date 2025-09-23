import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { revalidateTag } from 'next/cache';

export const dynamic = 'force-dynamic';

// Webhook署名を検証する関数
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  if (!signature || !secret) return false;
  
  // 実際の実装では、HMAC-SHA256などを使用して署名を検証
  // ここでは簡単な比較を行う
  const expectedSignature = `sha256=${Buffer.from(payload + secret).toString('base64')}`;
  return signature === expectedSignature;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = headers();
    const signature = headersList.get('x-webhook-signature');
    const webhookSecret = process.env.WEBHOOK_SECRET;

    // 署名検証（本番環境でのみ）
    if (process.env.NODE_ENV === 'production' && webhookSecret) {
      if (!signature || !verifyWebhookSignature(body, signature, webhookSecret)) {
        return NextResponse.json(
          { error: 'Invalid webhook signature' },
          { status: 401 }
        );
      }
    }

    const payload = JSON.parse(body);
    const { type, data } = payload;

    console.log(`Received webhook: ${type}`, data);

    switch (type) {
      case 'market_close':
        // 市場終了時のデータ更新
        console.log('Processing market close webhook...');
        
        // EODデータ取得をトリガー
        if (process.env.NODE_ENV === 'production') {
          // 本番環境では外部のジョブキューやCronジョブをトリガー
          // ここでは簡単にキャッシュを無効化
          revalidateTag('stock:*');
          revalidateTag('list:*');
          revalidateTag('meta');
        }
        
        return NextResponse.json({ 
          success: true, 
          message: 'Market close processing initiated' 
        });

      case 'intraday_update':
        // 日中データ更新
        console.log('Processing intraday update webhook...');
        
        const { codes } = data;
        if (codes && Array.isArray(codes)) {
          // 特定の銘柄のキャッシュを無効化
          codes.forEach((code: string) => {
            revalidateTag(`stock:${code}`);
          });
        } else {
          // 全銘柄のキャッシュを無効化
          revalidateTag('stock:*');
        }
        
        return NextResponse.json({ 
          success: true, 
          message: 'Intraday update processing completed' 
        });

      case 'symbol_list_update':
        // 銘柄リスト更新
        console.log('Processing symbol list update webhook...');
        
        revalidateTag('list:*');
        revalidateTag('meta');
        
        return NextResponse.json({ 
          success: true, 
          message: 'Symbol list update processing completed' 
        });

      case 'maintenance':
        // メンテナンス実行
        console.log('Processing maintenance webhook...');
        
        // 全キャッシュを無効化
        revalidateTag('stock:*');
        revalidateTag('list:*');
        revalidateTag('meta');
        
        return NextResponse.json({ 
          success: true, 
          message: 'Maintenance processing completed' 
        });

      default:
        console.warn(`Unknown webhook type: ${type}`);
        return NextResponse.json(
          { error: 'Unknown webhook type' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET メソッドでヘルスチェック
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    webhooks: [
      'market_close',
      'intraday_update', 
      'symbol_list_update',
      'maintenance'
    ]
  });
}
