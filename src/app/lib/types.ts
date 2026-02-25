
export type Category = 'Reliable' | 'Discovery' | 'Custom';

export interface FeedSource {
  id: string;
  name: string;
  url: string;
  category: Category;
  icon?: string;
}

export interface Article {
  id: string;
  title: string;
  content: string;
  summary?: string;
  sourceName: string;
  sourceUrl?: string; // オプショナルに変更
  publishedAt: string;
  category: string; // カテゴリー判定を柔軟にするためstringに変更
  link: string;
  imageUrl?: string;
}
