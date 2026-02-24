
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

const parser = new Parser();

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
    const { firestore } = initializeFirebase();
    let addedCount = 0;
    const errors: string[] = [];

    for (const source of input.sources) {
      try {
        const feed = await parser.parseURL(source.url);
        
        // 最新の10件のみを処理（コストと速度のバランス）
        const items = feed.items.slice(0, 10);

        for (const item of items) {
          if (!item.link || !item.title) continue;

          // 重複チェック
          const q = query(collection(firestore, 'articles'), where('url', '==', item.link));
          const existing = await getDocs(q);

          if (existing.empty) {
            const content = item.contentSnippet || item.content || '';
            
            // 要約の生成
            let summary = '';
            try {
              const summaryResult = await summarizeAggregatedArticleContent({
                title: item.title,
                content: content
              });
              summary = summaryResult.summary;
            } catch (e) {
              console.error('Summary generation failed:', e);
            }

            // Firestoreに保存
            await addDoc(collection(firestore, 'articles'), {
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
          }
        }
      } catch (e: any) {
        errors.push(`${source.name}: ${e.message}`);
      }
    }

    return { addedCount, errors };
  }
);
