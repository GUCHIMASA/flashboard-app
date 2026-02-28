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
  translatedTitle: z.string().describe('キャッチーな日本語タイトル'),
  act: z.string().describe('ACT - 何が起きたかの詳細'),
  context: z.string().describe('CONTEXT - なぜ重要か'),
  effect: z.string().describe('EFFECT - 何が変わるか'),
  tags: z.array(z.string()).describe('既存のタグ（変更なし）'),
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
1. [translatedTitle]: 日本のテックメディアの見出しのように、思わず読みたくなる短い一文を作成してください。固有名詞・数字を積極的に使い、20文字以内を目安にしてください。
2. [act]: タイトルの補足として、出来事の具体的な内容を説明してください。固有名詞・数字・日付を優先して使い、1〜2文、40文字程度でまとめてください。
3. [context]: 業界・社会的な背景や意味を簡潔にまとめてください。2〜3文、60文字程度でまとめてください。
4. [effect]: この出来事によって今後何が変わるかを簡潔にまとめてください。1〜2文、40文字程度でまとめてください。
5. [tags]: 以下の固定タグリストの中から、記事に該当するものを1〜4個選んでください。自由なタグ生成は禁止です。

注意：
各項目（act, context, effect）のテキスト冒頭に「▲」「●」「■」などの記号を絶対に入れないでください。純粋なテキストのみを出力してください。
「ですます口調」は使わず簡潔にまとめ、情報量を多めに含めることを心がけてください。

固定タグリスト：
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