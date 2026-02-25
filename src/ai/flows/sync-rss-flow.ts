
'use server';
/**
 * @fileOverview RSSフィードを同期し、Geminiで翻訳・要約を生成してFirestoreに保存するフロー。
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import Parser from 'rss-parser';
import { initializeFirebase } from '@/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';

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
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_NONE' },
    ]
  },
  prompt: `
あなたは一流のテックニュース編集者です。以下の記事を日本の読者向けに最適化してください。

指示：
1. [translatedTitle]: 元の英語タイトルを、日本のテックメディア（例: TechCrunch Japan）のような、目を引く自然な日本語に翻訳・リライトしてください。
2. [summary]: 記事の最も重要なポイントを3つ抽出し、「・」から始まる箇条書きの日本語で、合計50文字程度で簡潔にまとめてください。

入力データ：
元のタイトル: {{{originalTitle}}}
内容: {{{content}}}

出力は必ず指定されたスキーマに従い、すべてのテキストを日本語にしてください。
`
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
          const isEnglish = (existingData?.title || '').match(/^[a-zA-Z0-9\s\p{P}]+$/u);
          
          // needsProcessingの条件からキーワード判定を削除
          const needsProcessing = existingSnapshot.empty || 
            !existingData?.summary || 
            isEnglish;

          if (needsProcessing) {
            console.log(`[AI処理開始] 記事: ${item.title}`);
            
            let summary = '';
            let translatedTitle = item.title;

            // APIキーの存在確認 (true/falseのみ)
            console.log(`[AI Key Check] Before prompt: ${!!process.env.GOOGLE_GENAI_API_KEY}`);

            try {
              const { output } = await articleTransformPrompt({
                originalTitle: item.title,
                content: contentSnippet.substring(0, 1500)
              });
              
              console.log(`[AI Key Check] After prompt: ${!!process.env.GOOGLE_GENAI_API_KEY}`);

              if (output) {
                summary = output.summary;
                translatedTitle = output.translatedTitle;
              }
            } catch (e: any) {
              console.error(`[AI Error] ${item.title}:`, e.message);
              console.log(`[AI Key Check] After prompt (error): ${!!process.env.GOOGLE_GENAI_API_KEY}`);
              // 失敗時はsummaryを空文字、titleを元のままにする
              summary = '';
              translatedTitle = item.title;
            }

            const articleData = {
              title: translatedTitle,
              originalTitle: item.title,
              content: contentSnippet.substring(0, 2000),
              summary: summary,
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
          }
          // 記事を1件処理するたびに2秒待機する (レート制限対策)
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
