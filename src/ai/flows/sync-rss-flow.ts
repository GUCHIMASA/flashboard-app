'use server';
/**
 * @fileOverview RSSフィードを同期し、Geminiで要約を生成してFirestoreに保存するフロー。
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import Parser from 'rss-parser';
import { initializeFirebase } from '@/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

// RSSパサーの初期化
const parser = new Parser({
  headers: {
    'Accept': 'application/rss+xml, application/xml, text/xml, */*',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  },
  timeout: 15000,
});

const SyncRssInputSchema = z.object({
  sources: z.array(z.object({
    name: z.string(),
    url: z.string(),
    category: z.string()
  }))
});

const summarizePrompt = ai.definePrompt({
  name: 'syncSummarizePrompt',
  input: { schema: z.object({ title: z.string(), content: z.string() }) },
  output: { schema: z.object({ summary: z.string() }) },
  prompt: `あなたはニュース記事を極めて簡潔に要約するAIです。
以下の記事を日本語で要約してください：
- 必ず3つの短い箇条書きのみ。
- 1文は15文字以内。
- 体言止め。

タイトル: {{title}}
本文: {{content}}`,
});

export async function syncRss(input: z.infer<typeof SyncRssInputSchema>) {
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
        if (!source.url) continue;
        
        const feed = await parser.parseURL(source.url);
        // タイムアウトを避けるため、最新の2件に限定
        const items = feed.items.slice(0, 2);

        for (const item of items) {
          if (!item.link || !item.title) continue;

          const articlesRef = collection(firestore, 'articles');
          const q = query(articlesRef, where('url', '==', item.link));
          const existingSnapshot = await getDocs(q);

          if (existingSnapshot.empty) {
            const content = item.contentSnippet || item.content || item.title || '';
            
            let summary = '';
            try {
              const { output } = await summarizePrompt({
                title: item.title,
                content: content.substring(0, 1000)
              });
              summary = output?.summary || '';
            } catch (e) {
              console.error(`AI Summary failed for ${item.title}`);
              summary = '要約の生成に失敗しました。';
            }

            await addDoc(articlesRef, {
              title: item.title,
              content: content,
              summary: summary,
              url: item.link,
              sourceName: source.name,
              publishedAt: item.isoDate || new Date().toISOString(),
              imageUrl: `https://picsum.photos/seed/${encodeURIComponent(item.title.substring(0,10))}/800/400`,
              category: source.category,
              createdAt: serverTimestamp()
            });
            
            addedCount++;
          }
        }
      } catch (e: any) {
        console.error(`Failed source ${source.name}:`, e.message);
        errors.push(`${source.name}: ${e.message}`);
      }
    }

    return { addedCount, errors };
  }
);
