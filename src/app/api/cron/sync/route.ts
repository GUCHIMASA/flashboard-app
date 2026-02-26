import { NextResponse } from 'next/server';
import { syncRss } from '@/ai/flows/sync-rss-flow';
import { INITIAL_SOURCES } from '@/app/lib/mock-data';

export const maxDuration = 60; // APIルートの実行時間を60秒に設定

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (!process.env.CRON_SECRET) {
    console.error('[Cron Error] CRON_SECRET environment variable is not set.');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  if (!secret || secret !== process.env.CRON_SECRET) {
    console.error('[Cron Error] Unauthorized access attempt.');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('[Cron Sync] Starting automated sync...');
    
    // 管理者用のダミーメール
    const ADMIN_EMAIL = 'admin@example.com';

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
