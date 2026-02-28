
import { NextResponse } from 'next/server';
import { syncRss } from '@/ai/flows/sync-rss-flow';
import { INITIAL_SOURCES } from '@/app/lib/mock-data';

export const maxDuration = 60; 

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const ADMIN_EMAIL = 'kawa_guchi_masa_hiro@yahoo.co.jp';

    const result = await syncRss({
      sources: INITIAL_SOURCES.map(s => ({
        name: s.name,
        url: s.url,
        category: s.category
      })),
      requesterEmail: ADMIN_EMAIL
    });

    return NextResponse.json({
      message: 'Automated sync completed',
      timestamp: new Date().toISOString(),
      ...result
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
