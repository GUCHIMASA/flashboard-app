
import { Article, FeedSource } from './types';

export const INITIAL_SOURCES: FeedSource[] = [
  { id: '1', name: 'Anthropic', url: 'https://www.anthropic.com/news/rss.xml', category: 'Reliable' },
  { id: '2', name: 'OpenAI', url: 'https://openai.com/news/rss.xml', category: 'Reliable' },
  { id: '3', name: 'Google DeepMind', url: 'https://deepmind.google/blog/feed/basic/', category: 'Reliable' },
  { id: '4', name: 'Meta AI', url: 'https://ai.meta.com/blog/rss/', category: 'Reliable' },
  { id: '5', name: 'Product Hunt', url: 'https://www.producthunt.com/feed', category: 'Discovery' },
  { id: '6', name: 'Hacker News', url: 'https://news.ycombinator.com/rss', category: 'Discovery' },
  { id: '7', name: 'GitHub Trending', url: 'https://github.com/trending/ai', category: 'Discovery' },
];

export const MOCK_ARTICLES: Article[] = [
  {
    id: 'a1',
    title: 'Introducing Claude 3.5 Sonnet',
    content: 'Today we are announcing Claude 3.5 Sonnet, our first model in the Claude 3.5 family. It sets new industry benchmarks for reasoning, knowledge, and coding proficiency, while being significantly faster than Claude 3 Opus.',
    sourceName: 'Anthropic',
    sourceUrl: 'https://anthropic.com',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    category: 'Reliable',
    link: 'https://www.anthropic.com/news/claude-3-5-sonnet'
  },
  {
    id: 'a2',
    title: 'GPT-4o: Our New Flagship Model',
    content: 'We are introducing GPT-4o, our new flagship model that can reason across audio, vision, and text in real time. GPT-4o ("o" for "omni") is a step towards much more natural human-computer interaction—it accepts as input any combination of text, audio, and image and generates any combination of text, audio, and image outputs.',
    sourceName: 'OpenAI',
    sourceUrl: 'https://openai.com',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    category: 'Reliable',
    link: 'https://openai.com/index/hello-gpt-4o/'
  },
  {
    id: 'a3',
    title: 'AlphaFold 3: Accurate structure prediction of biomolecular interactions',
    content: 'AlphaFold 3 is a revolutionary new AI model that can predict the structure and interactions of all life’s molecules with unprecedented accuracy. This research will help scientists understand how life works at the molecular level, which could lead to breakthroughs in medicine and biology.',
    sourceName: 'Google DeepMind',
    sourceUrl: 'https://deepmind.google',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    category: 'Reliable',
    link: 'https://deepmind.google/technologies/alphafold-3/'
  },
  {
    id: 'a4',
    title: 'Llama 3: The most capable openly available LLM to date',
    content: 'Meta is releasing Llama 3, the next generation of our state-of-the-art open source large language model. Llama 3 models will soon be available on AWS, Google Cloud, Hugging Face, and more.',
    sourceName: 'Meta AI',
    sourceUrl: 'https://ai.meta.com',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    category: 'Reliable',
    link: 'https://ai.meta.com/blog/meta-llama-3/'
  },
  {
    id: 'a5',
    title: 'AI Video Editor Pro',
    content: 'A new AI-powered video editing suite that automates cuts and color grading using generative AI. It allows creators to produce high-quality videos in minutes rather than hours.',
    sourceName: 'Product Hunt',
    sourceUrl: 'https://producthunt.com',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
    category: 'Discovery',
    link: 'https://producthunt.com'
  },
  {
    id: 'a6',
    title: 'Show HN: Neural-Search - A vector database in 100 lines of Python',
    content: 'I built a lightweight vector search engine for my AI projects. It supports cosine similarity and FAISS-like indexing but is tiny and easy to embed.',
    sourceName: 'Hacker News',
    sourceUrl: 'https://news.ycombinator.com',
    publishedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    category: 'Discovery',
    link: 'https://news.ycombinator.com'
  }
];
