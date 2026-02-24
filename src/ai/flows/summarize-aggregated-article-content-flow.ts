'use server';
/**
 * @fileOverview 記事の内容を極めて簡潔に要約するGenkitフロー。
 *
 * - summarizeAggregatedArticleContent - 日本の多忙な読者向けに、3つの短い言葉で要約を生成します。
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SummarizeAggregatedArticleContentInputSchema = z.object({
  title: z.string().describe('記事のタイトル'),
  content: z.string().describe('記事の本文'),
});
export type SummarizeAggregatedArticleContentInput = z.infer<typeof SummarizeAggregatedArticleContentInputSchema>;

const SummarizeAggregatedArticleContentOutputSchema = z.object({
  summary: z.string().describe('記事の極めて簡潔な要約（3つの要点）'),
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
  prompt: `あなたはニュース記事を「一瞬で理解できる」ように要約するAIです。

以下のガイドラインに厳格に従って、記事を日本語で要約してください：

ガイドライン:
1. 必ず日本語で、3つの短い箇条書き（・）のみで出力してください。
2. 1文は「最大15文字以内」にしてください。体言止めを推奨します。
3. 余計な説明は一切省き、最も重要なポイントだけを抜き出してください。
4. 全体で50文字程度に収めてください。

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
    return output!;
  }
);
