
import { NextResponse } from 'next/server';
import { syncRss } from '@/ai/flows/sync-rss-flow';
import { INITIAL_SOURCES } from '@/app/lib/mock-data';

/**
 * Cloud Schedulerから呼び出される自動同期用エンドポイント
 * 
 * セキュリティのため、環境変数 CRON_SECRET をクエリパラメータとして検証します。
 * 例: /api/cron/sync?secret=your_secret_key
 */

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  // セキュリティチェック: 環境変数が未設定の場合は安全のため実行を拒否
  if (!process.env.CRON_SECRET) {
    console.error('[Cron Error] CRON_SECRET environment variable is not set.');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  if (!secret || secret !== process.env.CRON_SECRET) {
    console.error('[Cron Error] Unauthorized access attempt with secret:', secret);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('[Cron Sync] Starting automated sync...');
    
    // 管理者のメールアドレス（フロー内のバリデーションを通過させるために必要）
    const ADMIN_EMAIL = 'kawa_guchi_masa_hiro@yahoo.co.jp';

    const result = await syncRss({
      sources: INITIAL_SOURCES.map(s => ({
        name: s.name,
        url: s.url,
        category: s.category
      })),
      requesterEmail: ADMIN_EMAIL
    });

    console.log('[Cron Sync] Completed successfully:', result);
    return NextResponse.json({
      message: 'Automated sync completed',
      timestamp: new Date().toISOString(),
      ...result
    });
  } catch (error: any) {
    console.error('[Cron Error] Sync failed:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
