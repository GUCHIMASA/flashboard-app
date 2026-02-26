import { Article, FeedSource } from './types';

export const INITIAL_SOURCES: FeedSource[] = [
  { id: '1', name: 'Anthropic News', url: 'https://www.anthropic.com/index.xml', category: 'Reliable' },
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
  }
];
