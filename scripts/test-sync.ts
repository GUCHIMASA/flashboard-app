/**
 * 同期処理の稼働テスト用スクリプト
 * Cron /api/cron/sync と同じ処理を直接実行し、結果を標準出力に表示します。
 *
 * 使い方:
 *   npx tsx scripts/test-sync.ts
 *
 * 必要な環境変数（.env.local に設定）:
 *   - GEMINI_API_KEY … 記事要約に必須
 *   - NEXT_PUBLIC_FIREBASE_* … Firestore 保存に必須
 *   - FIREBASE_SERVICE_ACCOUNT_KEY または GOOGLE_APPLICATION_CREDENTIALS … ローカルで Admin SDK 経由の書き込みに必須
 */
import dotenv from 'dotenv';
import path from 'path';

// プロジェクトルートの .env / .env.local を読み込む（npm run では cwd がルートになる）
const root = process.cwd();
dotenv.config({ path: path.join(root, '.env') });
dotenv.config({ path: path.join(root, '.env.local'), override: true });

const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
  'GEMINI_API_KEY',
] as const;

function checkEnv(): void {
  const missing = requiredEnvVars.filter((key) => !process.env[key]?.trim());
  if (missing.length > 0) {
    console.error('以下の環境変数が .env.local に設定されていません:\n');
    missing.forEach((key) => console.error('  -', key));
    console.error('\nFirebase は Firebase コンソール、GEMINI_API_KEY は Google AI Studio で取得してください。');
    process.exit(1);
  }
}

async function main() {
  checkEnv();

  const { syncRss } = await import('../src/ai/flows/sync-rss-flow');
  const { INITIAL_SOURCES } = await import('../src/app/lib/mock-data');

  console.log('--- 同期稼働テスト開始 ---');
  console.log('ソース数:', INITIAL_SOURCES.length);
  console.log('');

  const start = Date.now();

  try {
    const result = await syncRss({
      sources: INITIAL_SOURCES.map((s) => ({
        name: s.name,
        url: s.url,
        category: s.category,
      })),
      requesterEmail: process.env.ADMIN_EMAIL ?? undefined,
    });

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log('--- 結果 ---');
    console.log('追加:', result.addedCount);
    console.log('更新:', result.updatedCount);
    console.log('処理したソース数:', result.processedSources);
    console.log('所要時間:', elapsed, '秒');
    if (result.errors?.length) {
      console.log('\n[RSS取得エラー]');
      result.errors.forEach((e) => console.log('  -', e));
    }
    if (result.aiErrors?.length) {
      console.log('\n[AI要約エラー]');
      result.aiErrors.forEach((e) => console.log('  -', e));
    }
    console.log('\n--- 完了 ---');
  } catch (err: unknown) {
    console.error('同期エラー:', err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

main();
