
'use server';
/**
 * @fileOverview RSSフィードを同期し、Geminiで要約を生成してFirestoreに保存するフロー。
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import Parser from 'rss-parser';
import { initializeFirebase } from '@/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { summarizeAggregatedArticleContent } from './summarize-aggregated-article-content-flow';

// RSSパサーの初期化（User-Agentを設定してアクセス拒否を回避）
const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  },
  timeout: 10000, // 10秒でタイムアウト
});

const SyncRssInputSchema = z.object({
  sources: z.array(z.object({
    name: z.string(),
    url: z.string(),
    category: z.string()
  }))
});
export type SyncRssInput = z.infer<typeof SyncRssInputSchema>;

export async function syncRss(input: SyncRssInput) {
  return syncRssFlow(input);
}

const syncRssFlow = ai.defineFlow(
  {
    name: 'syncRssFlow',
    inputSchema: SyncRssInputSchema,
    outputSchema: z.object({
      addedCount: z.number(),
      errors: z.array(z.string())
    }),
  },
  async (input) => {
    // サーバーサイドでのFirebase初期化
    const { firestore } = initializeFirebase();
    let addedCount = 0;
    const errors: string[] = [];

    // タイムアウトを避けるため、全ソースから少しずつ取得する
    for (const source of input.sources) {
      try {
        console.log(`Fetching feed: ${source.name} (${source.url})`);
        const feed = await parser.parseURL(source.url);
        
        // 1つのソースにつき最新の3件のみを処理（タイムアウト回避と初期データの確保）
        const items = feed.items.slice(0, 3);

        for (const item of items) {
          if (!item.link || !item.title) continue;

          // URLで重複チェック
          const articlesRef = collection(firestore, 'articles');
          const q = query(articlesRef, where('url', '==', item.link));
          const existingSnapshot = await getDocs(q);

          if (existingSnapshot.empty) {
            const content = item.contentSnippet || item.content || item.title || '';
            
            // 要約の生成
            let summary = '';
            try {
              const summaryResult = await summarizeAggregatedArticleContent({
                title: item.title,
                content: content.substring(0, 2000) // 文字数制限
              });
              summary = summaryResult.summary;
            } catch (e) {
              console.error(`Summary generation failed for ${item.title}:`, e);
              summary = '要約の生成に失敗しました。本文をご覧ください。';
            }

            // Firestoreに保存（awaitせずに並行処理も可能だが、安全のため直列で）
            await addDoc(articlesRef, {
              title: item.title,
              content: content,
              summary: summary,
              url: item.link,
              sourceName: source.name,
              publishedAt: item.isoDate || new Date().toISOString(),
              imageUrl: `https://picsum.photos/seed/${encodeURIComponent(item.title)}/800/400`,
              category: source.category,
              createdAt: serverTimestamp()
            });
            
            addedCount++;
            console.log(`Added article: ${item.title}`);
          }
        }
      } catch (e: any) {
        console.error(`Failed to sync source ${source.name}:`, e.message);
        errors.push(`${source.name}: ${e.message}`);
      }
    }

    return { addedCount, errors };
  }
);
