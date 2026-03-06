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
  translatedTitle: z.string().describe('F (Flash) - 25文字以内のキャッチーな見出し'),
  act: z.string().describe('A (Act) - 何が起きたか（60文字以内）'),
  context: z.string().describe('C (Context) - なぜ重要か（60文字以内）'),
  effect: z.string().describe('E (Effect) - どんな影響を生むか（60文字以内）'),
  importance: z.number().min(1).max(3).describe('重要度 (1:参考, 2:特定分野, 3:業界全体)'),
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
  prompt: `あなたは一流のテックニュース編集者です。以下の記事を、日本の読者が「5秒で俯瞰」できる「FACE要約フォーマット」に厳格に従って最適化してください。

--- FACE要約生成ルール ---

1. [translatedTitle] (Flash):
   - 読者が次の一行を読みたくなるキャッチーな日本語タイトル。
   - 固有名詞・数字を優先的に含め、背景や意味は含めず事実のみを尖らせる。
   - 制限: 25文字以内。

2. [act] (Act - 何が起きたか):
   - 固有名詞・数字・日付のみで構成。背景・理由・影響は書かない。
   - 「〜が〜した／発表した／リリースした」形式で完結させる。
   - 制限: 2文以内、約60文字。

3. [context] (Context - なぜ重要か):
   - 出来事が属する業界トレンドのみを記述。Actの内容は繰り返さない。
   - 「〜という流れの中で」「〜が課題だったが」などの形式で始める。
   - 制限: 2文以内、約60文字。

4. [effect] (Effect - どんな影響を生むか):
   - 主語を必ず明示（開発者・企業・個人など）。
   - 抽象表現（例：便利になる、進化する）や自明な結論は禁止。
   - 制限: 2文以内、約60文字。

5. [importance] (重要度):
   - 3：業界全体に影響
   - 2：特定分野に影響
   - 1：参考情報レベル

6. [tags] (タグ付け):
   - 以下のリストから1〜4個選択（自由生成禁止、企業タグは直接関与時のみ）。
   【内容系】新モデル / ツール / 研究・論文 / ビジネス / 規制・政策 / セキュリティ
   【企業系】OpenAI / Anthropic / Google / Meta / Microsoft / その他企業
   【動き系】新リリース / 資金調達 / 提携 / 障害

--- 制約 ---
- 各項目冒頭に記号（▲、●等）を絶対に入れない。
- 「です・ます」口調は避け、体言止めや「〜だ」形式を用いるが、簡潔さを最優先する。

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