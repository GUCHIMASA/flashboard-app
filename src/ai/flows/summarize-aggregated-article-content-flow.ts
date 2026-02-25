
'use server';
/**
 * @fileOverview 記事のタイトル翻訳、要約、およびタグ付与を統合的に行うAIフロー。
 *
 * - summarizeAggregatedArticleContent - 英語のタイトルを日本語に翻訳し、内容を要約し、固定リストからタグを付与します。
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SummarizeAggregatedArticleContentInputSchema = z.object({
  title: z.string().describe('元の記事タイトル'),
  content: z.string().describe('記事の本文'),
  sourceName: z.string().optional().describe('記事のソース名（タグ選定の参考）'),
});
export type SummarizeAggregatedArticleContentInput = z.infer<typeof SummarizeAggregatedArticleContentInputSchema>;

const SummarizeAggregatedArticleContentOutputSchema = z.object({
  translatedTitle: z.string().describe('魅力的で自然な日本語に翻訳されたタイトル'),
  summary: z.string().describe('記事の要点を3つ（・）で簡潔にまとめた日本語要約'),
  tags: z.array(z.string()).describe('指定されたリストから選択されたタグ（1〜4個）'),
});
export type SummarizeAggregatedArticleContentOutput = z.infer<typeof SummarizeAggregatedArticleContentOutputSchema>;

export async function summarizeAggregatedArticleContent(
  input: SummarizeAggregatedArticleContentInput
): Promise<SummarizeAggregatedArticleContentOutput> {
  return summarizeAggregatedArticleContentFlow(input);
}

const summarizePrompt = ai.definePrompt({
  name: 'summarizeArticlePrompt',
  input: { schema: SummarizeAggregatedArticleContentInputSchema },
  output: { schema: SummarizeAggregatedArticleContentOutputSchema },
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_NONE' },
    ]
  },
  prompt: `あなたは一流のテックニュース編集者です。以下の記事を日本の読者向けに最適化してください。

指示：
1. [translatedTitle]: 元のタイトルを、日本のテックメディアのような自然な日本語に翻訳・リライトしてください。
2. [summary]: 記事の最も重要なポイントを3つ抽出し、「・」から始まる箇条書きの日本語で、合計50文字程度で簡潔にまとめてください。
3. [tags]: 以下の固定タグリストの中から、記事に該当するものを1〜4個選んでください。自由なタグ生成は禁止です。

タグリスト：
【内容系】新モデル, ツール, 研究・論文, ビジネス, 規制・政策, セキュリティ
【企業系】OpenAI, Anthropic, Google, Meta, Microsoft, その他企業
【動き系】新リリース, 資金調達, 提携, 障害

※企業系タグは、記事がその企業に直接言及している場合のみ付与してください。

記事タイトル: {{{title}}}
ソース名: {{{sourceName}}}
記事本文: {{{content}}}`,
});

const summarizeAggregatedArticleContentFlow = ai.defineFlow(
  {
    name: 'summarizeAggregatedArticleContentFlow',
    inputSchema: SummarizeAggregatedArticleContentInputSchema,
    outputSchema: SummarizeAggregatedArticleContentOutputSchema,
  },
  async (input) => {
    const { output } = await summarizePrompt(input);
    if (!output) throw new Error('AIが回答を拒否または生成に失敗しました。');
    return output;
  }
);
