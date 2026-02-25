
'use server';
/**
 * @fileOverview RSSフィードを同期し、Geminiで翻訳・要約を生成してFirestoreに保存するフロー。
 * 既存の英語記事も要約がない場合は自動的に翻訳・更新します。
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
    ]
  },
  prompt: `
あなたはニュース記事を日本語で要約・翻訳する専門家です。
以下の情報を元に、日本の読者が一瞬で理解できる内容に変換してください。

1. [translatedTitle]: 
   - 記事のタイトルを日本のテックニュース風に翻訳してください。
   - 英語のままでなく、必ず「日本語」で出力してください。
   - 読者の興味を引く、短くインパクトのある表現にしてください。

2. [summary]: 
   - 記事の最も重要なポイントを「3つの箇条書き（・）」で要約してください。
   - 各文は15文字以内、全体で50文字程度。
   - 余計な説明は省き、事実のみを伝えてください。

元のタイトル: {{{originalTitle}}}
内容の断片: {{{content}}}
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

    if (!process.env.GOOGLE_GENAI_API_KEY && !process.env.GEMINI_API_KEY) {
      throw new Error('AI APIキーが設定されていません。環境変数を確認してください。');
    }

    for (const source of input.sources) {
      if (!source.url || !source.url.startsWith('http')) continue;
      
      try {
        console.log(`[RSS Sync] 取得中: ${source.name}`);
        const feed = await parser.parseURL(source.url);
        processedSources++;

        // 各ソース最新3件を処理
        const items = feed.items.slice(0, 3);

        for (const item of items) {
          const link = item.link || item.guid || '';
          if (!link || !item.title) continue;

          const articlesRef = collection(firestore, 'articles');
          const q = query(articlesRef, where('link', '==', link));
          const existingSnapshot = await getDocs(q);

          const contentSnippet = item.contentSnippet || item.content || item.title || '';
          const needsProcessing = existingSnapshot.empty || 
            (existingSnapshot.docs[0].data().summary?.includes('失敗') || !existingSnapshot.docs[0].data().summary);

          if (needsProcessing) {
            console.log(`[AI処理] 翻訳・要約開始: ${item.title}`);
            
            let summary = '';
            let translatedTitle = item.title;

            try {
              const { output } = await articleTransformPrompt({
                originalTitle: item.title,
                content: contentSnippet.substring(0, 1500)
              });
              
              if (output) {
                summary = output.summary;
                translatedTitle = output.translatedTitle;
              }
            } catch (e: any) {
              console.error(`[AI Error] 記事 "${item.title}" の処理に失敗:`, e.message);
              summary = '・AI解析に一時的に失敗しました\n・時間をおいて再同期してください\n・内容はリンク先で確認可能です';
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
        }
      } catch (e: any) {
        console.error(`[RSS Error] ソース "${source.name}" が失敗:`, e.message);
        errors.push(`${source.name}: ${e.message}`);
      }
    }

    return { addedCount, updatedCount, errors, processedSources };
  }
);
