'use server';
/**
 * @fileOverview This file implements a Genkit flow for summarizing aggregated article content.
 *
 * - summarizeAggregatedArticleContent - A function that generates a concise AI-powered summary for a given article.
 * - SummarizeAggregatedArticleContentInput - The input type for the summarizeAggregatedArticleContent function.
 * - SummarizeAggregatedArticleContentOutput - The return type for the summarizeAggregatedArticleContent function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SummarizeAggregatedArticleContentInputSchema = z.object({
  title: z.string().describe('The title of the article.'),
  content: z.string().describe('The full content of the article.'),
});
export type SummarizeAggregatedArticleContentInput = z.infer<typeof SummarizeAggregatedArticleContentInputSchema>;

const SummarizeAggregatedArticleContentOutputSchema = z.object({
  summary: z.string().describe('A concise, AI-generated summary of the article.'),
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
  prompt: `You are an AI assistant tasked with summarizing news articles concisely.

Summarize the following article, focusing on its main points and providing a brief overview that captures the essence of the content. The summary should be approximately 3-5 sentences long.

Article Title: {{{title}}}
Article Content: {{{content}}}`,
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
