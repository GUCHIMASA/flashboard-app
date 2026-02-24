'use server';
/**
 * @fileOverview 記事の内容を要約するGenkitフロー。
 *
 * - summarizeAggregatedArticleContent - 指定された記事に対して、AIによる簡潔な要約を日本語で生成します。
 * - SummarizeAggregatedArticleContentInput - 入力型定義。
 * - SummarizeAggregatedArticleContentOutput - 出力型定義。
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SummarizeAggregatedArticleContentInputSchema = z.object({
  title: z.string().describe('記事のタイトル'),
  content: z.string().describe('記事の本文'),
});
export type SummarizeAggregatedArticleContentInput = z.infer<typeof SummarizeAggregatedArticleContentInputSchema>;

const SummarizeAggregatedArticleContentOutputSchema = z.object({
  summary: z.string().describe('記事の簡潔な日本語による要約'),
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
  prompt: `あなたはニュース記事を簡潔に要約するAIアシスタントです。

以下の記事を、主要なポイントに焦点を当てて、エッセンスを捉えた簡潔な日本語の要約を作成してください。
要約は3〜5文程度の長さ（約150〜200文字程度）にしてください。

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
