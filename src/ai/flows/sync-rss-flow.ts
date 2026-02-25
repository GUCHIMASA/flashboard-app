'use server';
/**
 * @fileOverview RSSフィードを同期し、Geminiで要約を生成してFirestoreに保存するフロー。
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import Parser from 'rss-parser';
import { initializeFirebase } from '@/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

// RSSパサーの初期化（タイムアウトとユーザーエージェントを厳格に設定）
const parser = new Parser({
  headers: {
    'Accept': 'application/rss+xml, application/xml, text/xml, */*',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  },
  timeout: 5000, // 5秒でタイムアウト
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
- 必ず3つの短い箇条書き（・）のみ。
- 1文は15文字以内。
- 体言止め。

タイトル: {{title}}
本文: {{content}}`,
});

export async function syncRss(input: z.infer<typeof SyncRssInputSchema>) {
  try {
    return await syncRssFlow(input);
  } catch (error: any) {
    console.error('Flow Execution Error:', error);
    throw new Error(`同期フローの実行中に致命的なエラーが発生しました: ${error.message}`);
  }
}

const syncRssFlow = ai.defineFlow(
  {
    name: 'syncRssFlow',
    inputSchema: SyncRssInputSchema,
    outputSchema: z.object({
      addedCount: z.number(),
      errors: z.array(z.string()),
      processedSources: z.number()
    }),
  },
  async (input) => {
    const { firestore } = initializeFirebase();
    let addedCount = 0;
    const errors: string[] = [];
    let processedSources = 0;

    console.log(`Starting sync for ${input.sources.length} sources...`);

    for (const source of input.sources) {
      if (!source.url || !source.url.startsWith('http')) {
        continue;
      }
      
      try {
        console.log(`Attempting to fetch: ${source.name}`);
        const feed = await parser.parseURL(source.url);
        processedSources++;

        // タイムアウトを避けるため、テスト中は最新1件のみ取得
        const items = feed.items.slice(0, 1);

        for (const item of items) {
          if (!item.link || !item.title) continue;

          // 重複チェック
          const articlesRef = collection(firestore, 'articles');
          const q = query(articlesRef, where('url', '==', item.link));
          const existingSnapshot = await getDocs(q);

          if (existingSnapshot.empty) {
            console.log(`Summarizing: ${item.title}`);
            const content = item.contentSnippet || item.content || item.title || '';
            
            let summary = '';
            try {
              const { output } = await summarizePrompt({
                title: item.title,
                content: content.substring(0, 500) // 文字数を減らして高速化
              });
              summary = output?.summary || '';
            } catch (e: any) {
              console.error(`AI Summary failed for ${item.title}:`, e.message);
              summary = '要約の生成に失敗しました。';
            }

            await addDoc(articlesRef, {
              title: item.title,
              content: content.substring(0, 1000),
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
        const errorMsg = `${source.name}の取得に失敗: ${e.message}`;
        console.warn(errorMsg);
        errors.push(errorMsg);
      }
    }

    return { addedCount, errors, processedSources };
  }
);
