
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import Parser from 'rss-parser';
import { initializeFirebase } from '@/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { summarizeAggregatedArticleContent } from './summarize-aggregated-article-content-flow';

const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'mediaContent', { keepArray: true }],
      ['media:thumbnail', 'mediaThumbnail'],
      ['content:encoded', 'contentEncoded'],
      ['enclosure', 'enclosure'],
    ],
  },
  headers: {
    'Accept': 'application/rss+xml, application/xml, text/xml, */*',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  },
});

const SyncRssInputSchema = z.object({
  sources: z.array(z.object({
    name: z.string(),
    url: z.string(),
    category: z.string()
  })),
  requesterEmail: z.string().optional()
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
        const feed = await parser.parseURL(source.url);
        processedSources++;

        const items = feed.items.slice(0, 3);

        for (const item of items) {
          const link = item.link || item.guid || '';
          if (!link || !item.title) continue;

          let extractedImageUrl = '';
          if (item.enclosure && item.enclosure.url) {
            extractedImageUrl = item.enclosure.url;
          } else if (item.mediaContent && item.mediaContent.length > 0) {
            const media = item.mediaContent[0];
            extractedImageUrl = media.$?.url || media.url || '';
          } else if (item.mediaThumbnail) {
            extractedImageUrl = item.mediaThumbnail.$?.url || item.mediaThumbnail.url || '';
          } 

          const articlesRef = collection(firestore, 'articles');
          const q = query(articlesRef, where('link', '==', link));
          const existingSnapshot = await getDocs(q);

          const existingData = existingSnapshot.empty ? null : existingSnapshot.docs[0].data();
          const needsProcessing = existingSnapshot.empty || !existingData?.act;

          if (needsProcessing) {
            try {
              const cleanContent = (item.contentSnippet || item.content || item.description || '')
                .replace(/<[^>]*>?/gm, '')
                .replace(/\s+/g, ' ')
                .trim()
                .substring(0, 1500);

              const result = await summarizeAggregatedArticleContent({
                title: item.title,
                content: cleanContent,
                sourceName: source.name
              });

              if (result && result.translatedTitle && result.act) {
                const articleData = {
                  title: result.translatedTitle,
                  translatedTitle: result.translatedTitle,
                  originalTitle: item.title,
                  content: cleanContent,
                  act: result.act,
                  context: result.context,
                  effect: result.effect,
                  tags: result.tags || [],
                  link: link, 
                  sourceName: source.name,
                  publishedAt: item.isoDate || item.pubDate || new Date().toISOString(),
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
              console.warn(`[AI Skip] "${item.title}"`, e.message);
            }
          }
        }
      } catch (e: any) {
        errors.push(`${source.name}: ${e.message}`);
      }
    }

    return { addedCount, updatedCount, errors, processedSources };
  }
);
