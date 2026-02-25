
'use server';
/**
 * @fileOverview RSSフィードを同期し、Geminiで翻訳・要約を生成してFirestoreに保存するフロー。
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import Parser from 'rss-parser';
import { initializeFirebase } from '@/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

const parser = new Parser({
  headers: {
    'Accept': 'application/rss+xml, application/xml, text/xml, */*',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
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

const SummarizeOutputSchema = z.object({
  summary: z.string().describe('3つの短い箇条書き（・）形式の日本語要約'), 
  translatedTitle: z.string().describe('魅力的で自然な日本語に翻訳された記事タイトル') 
});

const articleTransformPrompt = ai.definePrompt({
  name: 'articleTransformPrompt',
  input: {
    schema: z.object({
      originalTitle: z.string(),
      content: z.string()
    })
  },
  output: { schema: SummarizeOutputSchema },
  prompt: `
あなたはニュース記事を日本語で要約・翻訳する専門家です。
以下の情報を元に、日本の読者が一瞬で理解できる内容に変換してください。

1. [translatedTitle]: 
   - 記事のタイトルを日本のテックニュース風に翻訳してください。
   - 読者の興味を引く、短くインパクトのある日本語にしてください。

2. [summary]: 
   - 記事の最も重要なポイントを「3つの箇条書き（・）」で要約してください。
   - 各文は15文字以内、全体で50文字程度。
   - 余計な説明は省き、事実のみを伝えてください。

元のタイトル: {{originalTitle}}
内容の断片: {{content}}
`
});

export async function syncRss(input: z.infer<typeof SyncRssInputSchema>) {
  try {
    return await syncRssFlow(input);
  } catch (error: any) {
    console.error('Flow Execution Error:', error);
    throw new Error(`同期フローの実行中にエラーが発生しました: ${error.message}`);
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

    for (const source of input.sources) {
      if (!source.url || !source.url.startsWith('http')) continue;
      
      try {
        console.log(`[RSS Sync] 取得中: ${source.name}`);
        const feed = await parser.parseURL(source.url);
        processedSources++;

        // 最新の2件を処理
        const items = feed.items.slice(0, 2);

        for (const item of items) {
          const link = item.link || item.guid || '';
          if (!link || !item.title) continue;

          const articlesRef = collection(firestore, 'articles');
          const q = query(articlesRef, where('link', '==', link));
          const existingSnapshot = await getDocs(q);

          if (existingSnapshot.empty) {
            console.log(`[AI処理] 翻訳・要約開始: ${item.title}`);
            const contentSnippet = item.contentSnippet || item.content || item.title || '';
            
            let summary = '・要約生成中...';
            let translatedTitle = item.title;

            try {
              const { output } = await articleTransformPrompt({
                originalTitle: item.title,
                content: contentSnippet.substring(0, 1000)
              });
              
              if (output) {
                summary = output.summary;
                translatedTitle = output.translatedTitle;
              }
            } catch (e: any) {
              console.error(`[AI Error] 記事 "${item.title}" の処理に失敗:`, e.message);
              summary = '・AI解析に失敗しました\n・元の内容をご確認ください\n・通信環境を確認してください';
            }

            await addDoc(articlesRef, {
              title: translatedTitle,
              originalTitle: item.title,
              content: contentSnippet.substring(0, 1500),
              summary: summary,
              link: link, 
              sourceName: source.name,
              publishedAt: item.isoDate || new Date().toISOString(),
              imageUrl: `https://picsum.photos/seed/${encodeURIComponent(item.title.substring(0,10))}/800/400`,
              category: source.category,
              createdAt: serverTimestamp()
            });
            
            addedCount++;
            console.log(`[成功] 保存完了: ${translatedTitle}`);
          }
        }
      } catch (e: any) {
        console.error(`[RSS Error] ソース "${source.name}" が失敗:`, e.message);
        errors.push(`${source.name}: ${e.message}`);
      }
    }

    return { addedCount, errors, processedSources };
  }
);
