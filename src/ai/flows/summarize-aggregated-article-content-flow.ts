'use server';
/**
 * @fileOverview 記事の内容を極めて簡潔に要約するGenkitフロー。
 *
 * - summarizeAggregatedArticleContent - 日本の多忙な読者向けに、一目でわかる要約を生成します。
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
  prompt: `あなたはニュース記事を日本の読者向けに「一目でわかるよう」要約する専門のAIアシスタントです。

以下のガイドラインに従って、記事（英語の場合もあります）を日本語で要約してください：

ガイドライン:
1. 必ず日本語で、3つの短い箇条書き（・）で出力してください。
2. 1文は20文字〜30文字程度、全体で100文字以内に収めてください。
3. 専門用語は避け、中学生でもわかる平易な言葉を選んでください。
4. 最も重要な結論やアクションを優先してください。

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
