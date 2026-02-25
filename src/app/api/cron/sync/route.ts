
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

  // セキュリティチェック
  if (!secret || secret !== process.env.CRON_SECRET) {
    console.error('[Cron Error] Unauthorized access attempt.');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('[Cron Sync] Starting automated sync...');
    
    // 自動実行時は、初期ソース（主要ソース）を対象に、管理者のメールアドレスで実行
    // ※ADMIN_EMAILはフロー内の定数と一致させる必要があります
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
      ...result
    });
  } catch (error: any) {
    console.error('[Cron Error] Sync failed:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
