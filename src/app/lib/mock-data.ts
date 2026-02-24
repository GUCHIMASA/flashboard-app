
import { Article, FeedSource } from './types';

export const INITIAL_SOURCES: FeedSource[] = [
  { id: '1', name: 'Anthropic News', url: 'https://www.anthropic.com/news/rss.xml', category: 'Reliable' },
  { id: '2', name: 'OpenAI Blog', url: 'https://openai.com/news/rss.xml', category: 'Reliable' },
  { id: '3', name: 'Google DeepMind', url: 'https://deepmind.google/blog/feed/basic/', category: 'Reliable' },
  { id: '4', name: 'Meta AI', url: 'https://ai.meta.com/blog/rss/', category: 'Reliable' },
  { id: '5', name: 'Product Hunt AI', url: 'https://www.producthunt.com/feed', category: 'Discovery' },
  { id: '6', name: 'Hacker News (AI)', url: 'https://news.ycombinator.com/rss', category: 'Discovery' },
];

export const MOCK_ARTICLES: Article[] = [
  {
    id: 'a1',
    title: 'Claude 3.5 Sonnet の発表',
    content: 'Anthropicは、Claude 3.5 ファミリーの最初のモデルである Claude 3.5 Sonnet を発表しました。推論能力、知識、コーディング能力において新たな業界基準を確立し、Claude 3 Opus よりも大幅に高速化されています。',
    sourceName: 'Anthropic',
    sourceUrl: 'https://anthropic.com',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    category: 'Reliable',
    link: 'https://www.anthropic.com/news/claude-3-5-sonnet',
    imageUrl: 'https://picsum.photos/seed/anthropic/800/400'
  },
  {
    id: 'a2',
    title: 'GPT-4o: 新しいフラッグシップモデル',
    content: 'OpenAIは、音声、視覚、テキストにまたがるリアルタイム推論が可能な新しいフラッグシップモデル GPT-4o を導入しました。「o」は omni（全方位）を意味し、より自然な人間とコンピュータの対話に向けた大きな一歩となります。',
    sourceName: 'OpenAI',
    sourceUrl: 'https://openai.com',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    category: 'Reliable',
    link: 'https://openai.com/index/hello-gpt-4o/',
    imageUrl: 'https://picsum.photos/seed/openai/800/400'
  },
  {
    id: 'a3',
    title: 'AlphaFold 3: 生体分子相互作用の正確な構造予測',
    content: 'Google DeepMindは、生命の全ての分子の構造と相互作用をかつてない精度で予測できる革新的なAIモデル AlphaFold 3 を発表しました。この研究は、分子レベルでの生命の理解を助け、創薬やバイオロジーの飛躍的な発展につながります。',
    sourceName: 'Google DeepMind',
    sourceUrl: 'https://deepmind.google',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    category: 'Reliable',
    link: 'https://deepmind.google/technologies/alphafold-3/',
    imageUrl: 'https://picsum.photos/seed/deepmind/800/400'
  },
  {
    id: 'a4',
    title: 'Llama 3: 最も高性能なオープンソースLLM',
    content: 'Metaは、次世代のステート・オブ・ジ・アートなオープンソース大規模言語モデル Llama 3 をリリースしました。AWS、Google Cloud、Hugging Face などの主要プラットフォームですぐに利用可能になります。',
    sourceName: 'Meta AI',
    sourceUrl: 'https://ai.meta.com',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    category: 'Reliable',
    link: 'https://ai.meta.com/blog/meta-llama-3/',
    imageUrl: 'https://picsum.photos/seed/metaai/800/400'
  },
  {
    id: 'a5',
    title: 'AI Video Editor Pro: 生成AIによる動画編集の自動化',
    content: '生成AIを活用してカット編集やカラーグレーディングを自動化する新しい動画編集スイートが登場。クリエイターは数時間かかっていた作業を数分で完了させることができます。',
    sourceName: 'Product Hunt',
    sourceUrl: 'https://producthunt.com',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
    category: 'Discovery',
    link: 'https://producthunt.com',
    imageUrl: 'https://picsum.photos/seed/videoai/800/400'
  }
];
