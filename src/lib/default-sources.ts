/**
 * アプリケーションのデフォルトニュースソースの定義
 */
export interface DefaultSource {
  name: string;
  url: string;
}

/**
 * 新規ユーザーに自動的に追加されるデフォルトソースのリスト
 */
export const defaultSources: DefaultSource[] = [
  {
    name: "Anthropic News",
    url: "https://raw.githubusercontent.com/Olshansk/rss-feeds/refs/heads/main/feeds/feed_anthropic.xml",
  },
  {
    name: "Meta Engineering (AI)",
    url: "https://engineering.fb.com/tag/ai/feed/",
  },
  {
    name: "OpenAI Blog",
    url: "https://openai.com/news/rss.xml",
  }
];
