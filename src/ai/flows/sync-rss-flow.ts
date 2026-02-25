
'use server';
/**
 * @fileOverview RSSフィードを同期し、統一された要約フローを使用してFirestoreに保存するフロー。
 * 管理者権限チェックをサーバー側で実施。
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import Parser from 'rss-parser';
import { initializeFirebase } from '@/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { summarizeAggregatedArticleContent } from './summarize-aggregated-article-content-flow';

// 管理者のメールアドレス
const ADMIN_EMAIL = 'kawa_guchi_masa_hiro@yahoo.co.jp';

const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'mediaContent', { keepArray: true }],
      ['media:thumbnail', 'mediaThumbnail'],
    ],
  },
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
  })),
  requesterEmail: z.string().describe('リクエストを送信したユーザーのメールアドレス')
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
    // 管理者チェック（手動・自動共通）
    if (input.requesterEmail !== ADMIN_EMAIL) {
      throw new Error('管理者のみがこの記事の更新を実行できます。');
    }

    const { firestore } = initializeFirebase();
    let addedCount = 0;
    let updatedCount = 0;
    const errors: string[] = [];
    let processedSources = 0;

    console.log(`[AI Key Check] Execution started. API Key exists: ${!!process.env.GOOGLE_GENAI_API_KEY}`);

    for (const source of input.sources) {
      if (!source.url || !source.url.startsWith('http')) continue;
      
      try {
        console.log(`[RSS Sync] Fetching: ${source.name}`);
        const feed = await parser.parseURL(source.url);
        processedSources++;

        // 直近3件に絞って処理
        const items = feed.items.slice(0, 3);

        for (const item of items) {
          const link = item.link || item.guid || '';
          if (!link || !item.title) continue;

          // 画像抽出
          let extractedImageUrl = '';
          if (item.enclosure && item.enclosure.url) {
            extractedImageUrl = item.enclosure.url;
          } else if (item.mediaContent && item.mediaContent.length > 0) {
            extractedImageUrl = item.mediaContent[0].$.url;
          } else if (item.mediaThumbnail && item.mediaThumbnail.$ && item.mediaThumbnail.$.url) {
            extractedImageUrl = item.mediaThumbnail.$.url;
          } else {
            const content = item.content || item.description || '';
            const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
            if (imgMatch && imgMatch[1]) extractedImageUrl = imgMatch[1];
          }

          const articlesRef = collection(firestore, 'articles');
          const q = query(articlesRef, where('link', '==', link));
          const existingSnapshot = await getDocs(q);

          const existingData = existingSnapshot.docs[0]?.data();
          // タイトルが英語のまま、または要約がない場合は処理対象
          const isEnglish = (existingData?.title || '').match(/^[a-zA-Z0-9\s\p{P}]+$/u);
          const needsProcessing = existingSnapshot.empty || !existingData?.summary || isEnglish;

          if (needsProcessing) {
            try {
              // 統一された要約・翻訳フローを呼び出し
              const result = await summarizeAggregatedArticleContent({
                title: item.title,
                content: (item.contentSnippet || item.content || '').substring(0, 1500)
              });

              if (result && result.translatedTitle && result.summary) {
                const articleData = {
                  title: result.translatedTitle,
                  originalTitle: item.title,
                  content: (item.contentSnippet || item.content || '').substring(0, 2000),
                  summary: result.summary,
                  link: link, 
                  sourceName: source.name,
                  publishedAt: item.isoDate || new Date().toISOString(),
                  imageUrl: extractedImageUrl || `https://picsum.photos/seed/${encodeURIComponent(item.title.substring(0,10))}/800/400`,
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
              }
            } catch (e: any) {
              // AI処理が失敗した場合は保存をスキップ（次回の同期で再試行）
              console.error(`[AI Skip] ${item.title}: AI processing failed. Skiping save.`, e.message);
            }
          }
          
          // レート制限対策: 1件ごとに2秒待機
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (e: any) {
        errors.push(`${source.name}: ${e.message}`);
      }
    }

    return { addedCount, updatedCount, errors, processedSources };
  }
);
