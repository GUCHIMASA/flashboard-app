'use server';
/**
 * @fileOverview 記事のタイトル翻訳と要約を統合的に行うAIフロー。
 *
 * - summarizeAggregatedArticleContent - 英語のタイトルを日本語に翻訳し、内容を3つの要点に要約します。
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SummarizeAggregatedArticleContentInputSchema = z.object({
  title: z.string().describe('元の記事タイトル'),
  content: z.string().describe('記事の本文'),
});
export type SummarizeAggregatedArticleContentInput = z.infer<typeof SummarizeAggregatedArticleContentInputSchema>;

const SummarizeAggregatedArticleContentOutputSchema = z.object({
  translatedTitle: z.string().describe('魅力的で自然な日本語に翻訳されたタイトル'),
  summary: z.string().describe('記事の要点を3つ（・）で簡潔にまとめた日本語要約'),
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
1. [translatedTitle]: 元のタイトルを、日本のテックメディア（例: TechCrunch Japan）のような、目を引く自然な日本語に翻訳・リライトしてください。
2. [summary]: 記事の最も重要なポイントを3つ抽出し、「・」から始まる箇条書きの日本語で、合計50文字程度で簡潔にまとめてください。1文は最大15文字以内とし、体言止めを推奨します。

記事タイトル: {{{title}}}
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
