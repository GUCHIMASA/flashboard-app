'use server';
/**
 * @fileOverview RSSフィードを同期し、統一された要約フローを使用してFirestoreに保存するフロー。
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import Parser from 'rss-parser';
import { initializeFirebase } from '@/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { summarizeAggregatedArticleContent } from './summarize-aggregated-article-content-flow';

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

export async function syncRss(input: z.infer<typeof SyncRssInputSchema>) {
  try {
    return await syncRssFlow(input);
  } catch (error: any) {
    console.error('Flow Execution Error:', error);
    throw new Error(`同期中にエラーが発生しました: ${error.message}`);
  }
}

const syncRssFlow = ai.defineFlow(
  {
    name: 'syncRssFlow',
    inputSchema: SyncRssInputSchema,
    outputSchema: z.object({
      addedCount: z.number(),
      updatedCount: z.number(),
      errors: z.array(z.string()),
      processedSources: z.number()
    }),
  },
  async (input) => {
    const { firestore } = initializeFirebase();
    let addedCount = 0;
    let updatedCount = 0;
    const errors: string[] = [];
    let processedSources = 0;

    for (const source of input.sources) {
      if (!source.url || !source.url.startsWith('http')) continue;
      
      try {
        console.log(`[RSS Sync] 取得中: ${source.name}`);
        const feed = await parser.parseURL(source.url);
        processedSources++;

        const items = feed.items.slice(0, 3);

        for (const item of items) {
          const link = item.link || item.guid || '';
          if (!link || !item.title) continue;

          const articlesRef = collection(firestore, 'articles');
          const q = query(articlesRef, where('link', '==', link));
          const existingSnapshot = await getDocs(q);

          const contentSnippet = item.contentSnippet || item.content || item.title || '';
          const existingData = existingSnapshot.docs[0]?.data();
          
          // 英語タイトルのまま、または要約がない場合は処理対象
          const isEnglish = (existingData?.title || '').match(/^[a-zA-Z0-9\s\p{P}]+$/u);
          const needsProcessing = existingSnapshot.empty || !existingData?.summary || isEnglish;

          if (needsProcessing) {
            console.log(`[AI処理開始] 記事: ${item.title}`);
            console.log(`[AI Key Check] Before prompt: ${!!process.env.GOOGLE_GENAI_API_KEY}`);

            try {
              // 統一された要約・翻訳フローを呼び出し
              const result = await summarizeAggregatedArticleContent({
                title: item.title,
                content: contentSnippet.substring(0, 1500)
              });
              
              console.log(`[AI Key Check] After prompt: ${!!process.env.GOOGLE_GENAI_API_KEY}`);

              if (result && result.translatedTitle && result.summary) {
                const articleData = {
                  title: result.translatedTitle,
                  originalTitle: item.title,
                  content: contentSnippet.substring(0, 2000),
                  summary: result.summary,
                  link: link, 
                  sourceName: source.name,
                  publishedAt: item.isoDate || new Date().toISOString(),
                  imageUrl: `https://picsum.photos/seed/${encodeURIComponent(item.title.substring(0,10))}/800/400`,
                  category: source.category,
                  updatedAt: serverTimestamp()
                };

                if (existingSnapshot.empty) {
                  await addDoc(articlesRef, { ...articleData, createdAt: serverTimestamp() });
                  addedCount++;
                } else {
                  const articleDoc = doc(firestore, 'articles', existingSnapshot.docs[0].id);
                  await updateDoc(articleDoc, articleData);
                  updatedCount++;
                }
                console.log(`[AI処理成功] 保存完了: ${result.translatedTitle}`);
              } else {
                console.error(`[AI Error] ${item.title}: 出力が不完全なため保存をスキップします。`);
              }
            } catch (e: any) {
              console.error(`[AI Error] ${item.title}: AI処理に失敗したため、このニュースの保存をスキップします。`, e.message);
              // 保存をスキップすることで、次回の同期時に再度AI処理が試行される
            }
          }
          
          // レート制限対策として2秒待機
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (e: any) {
        console.error(`[RSS Error] ${source.name}:`, e.message);
        errors.push(`${source.name}: ${e.message}`);
      }
    }

    return { addedCount, updatedCount, errors, processedSources };
  }
);
