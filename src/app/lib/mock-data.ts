import { Article, FeedSource } from './types';

export const INITIAL_SOURCES: FeedSource[] = [
  { id: '1', name: 'Anthropic News', url: 'https://www.anthropic.com/index.xml', category: 'Reliable' },
  { id: '2', name: 'OpenAI Blog', url: 'https://openai.com/news/rss.xml', category: 'Reliable' },
  { id: '3', name: 'Google DeepMind', url: 'https://deepmind.google/blog/feed/basic/', category: 'Reliable' },
  { id: '4', name: 'Meta AI', url: 'https://ai.meta.com/blog/rss/', category: 'Reliable' },
  { id: '5', name: 'Product Hunt AI', url: 'https://www.producthunt.com/feed', category: 'Discovery' },
  { id: '6', name: 'Hacker News (AI)', url: 'https://news.ycombinator.com/rss', category: 'Discovery' },
];

export const MOCK_ARTICLES: Article[] = [];
