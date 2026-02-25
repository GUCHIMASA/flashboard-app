
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

const summarizePrompt = ai.definePrompt({
  name: 'syncSummarizePrompt',
  input: { 
    schema: z.object({ 
      title: z.string(), 
      content: z.string() 
    }) 
  },
  output: { 
    schema: z.object({ 
      summary: z.string().describe('3つの短い箇条書き（・）形式の日本語要約'), 
      translatedTitle: z.string().describe('魅力的で自然な日本語に翻訳された記事タイトル') 
    }) 
  },
  prompt: `あなたはニュース記事を日本語に翻訳し、簡潔に要約するプロの編集者です。
以下の記事情報を処理してください：

1. translatedTitle: 
   - 元の英語タイトルを、日本の読者が一瞬で理解できる自然で魅力的な日本語に翻訳してください。
   - 専門用語は適切に日本語にするか、カタカナ表記にしてください。

2. summary: 
   - 記事の内容を以下のルールで要約してください。
   - 必ず「3つの短い箇条書き（・）」のみで構成すること。
   - 1文は15文字以内。
   - 体言止め（「〜を開発」「〜を発表」など）を推奨。

記事のタイトル: {{{title}}}
記事の本文/概要: {{{content}}}`,
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
        console.log(`[RSS Sync] Fetching: ${source.name} (${source.url})`);
        const feed = await parser.parseURL(source.url);
        processedSources++;

        // 負荷軽減のため最新2件を取得
        const items = feed.items.slice(0, 2);

        for (const item of items) {
          if (!item.link || !item.title) continue;

          const articlesRef = collection(firestore, 'articles');
          const q = query(articlesRef, where('link', '==', item.link));
          const existingSnapshot = await getDocs(q);

          if (existingSnapshot.empty) {
            console.log(`[AI Insight] Processing article: ${item.title}`);
            const content = item.contentSnippet || item.content || item.title || '';
            
            let summary = '';
            let translatedTitle = item.title;

            try {
              const { output } = await summarizePrompt({
                title: item.title,
                content: content.substring(0, 1000)
              });
              
              if (output) {
                summary = output.summary;
                translatedTitle = output.translatedTitle;
              } else {
                throw new Error('AI output was null');
              }
            } catch (e: any) {
              console.error(`[AI Error] Failed for "${item.title}":`, e.message);
              summary = '・解析エラーが発生しました\n・内容を確認できません\n・手動確認を推奨します';
              translatedTitle = `(翻訳失敗) ${item.title}`;
            }

            await addDoc(articlesRef, {
              title: translatedTitle,
              originalTitle: item.title,
              content: content.substring(0, 1500),
              summary: summary,
              link: item.link, 
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
        console.error(`[RSS Error] Source "${source.name}" failed:`, e.message);
        errors.push(`${source.name}: ${e.message}`);
      }
    }

    return { addedCount, errors, processedSources };
  }
);
