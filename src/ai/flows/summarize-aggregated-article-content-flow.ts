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
  prompt: `あなたはニュース記事を日本語で簡潔に要約する専門のAIアシスタントです。

入力された記事（英語の場合もあります）の内容を正確に理解し、日本の読者が一目で内容を把握できるように、以下のガイドラインに従って日本語で要約を作成してください。

ガイドライン:
1. 必ず日本語で出力してください。
2. 専門用語は、一般的な読者が理解できる言葉に置き換えるか、補足を加えてください。
3. 主なポイントを3〜5文程度（約150〜200文字）にまとめてください。
4. 客観的かつ事実に基づいたトーンで記述してください。

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
