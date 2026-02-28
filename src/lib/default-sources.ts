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
    url: "https://www.anthropic.com/index.xml",
  },
  {
    name: "Meta AI Blog",
    url: "https://ai.meta.com/blog/rss/",
  },
  {
    name: "OpenAI Blog",
    url: "https://openai.com/news/rss.xml",
  }
];
