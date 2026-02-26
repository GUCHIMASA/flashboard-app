
import { Metadata, ResolvingMetadata } from 'next';
import { doc, getDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import Header from '@/components/header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, ExternalLink, Calendar, Share2, Globe, Bookmark, Zap, Search, Waves } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

type Props = {
  params: Promise<{ id: string }>;
};

// サーバーサイドでのデータ取得
async function getArticle(id: string) {
  const { firestore } = initializeFirebase();
  const docRef = doc(firestore, 'articles', id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as any;
  }
  return null;
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = await params;
  const article = await getArticle(id);

  if (!article) return { title: '記事が見つかりません' };

  const title = article.translatedTitle || article.title;
  const description = article.act || article.content?.substring(0, 100);

  return {
    title: `${title} | AI Synapse`,
    description: description,
    openGraph: {
      title: title,
      description: description,
      images: [article.imageUrl || ''],
      type: 'article',
      url: `/article/${id}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      images: [article.imageUrl || ''],
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { id } = await params;
  const article = await getArticle(id);

  if (!article) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-black mb-4">記事が見つかりませんでした</h1>
        <Button asChild className="rounded-full">
          <Link href="/">トップへ戻る</Link>
        </Button>
      </div>
    );
  }

  const shareUrl = `https://ai-synapse.web.app/article/${id}`; // 仮のドメイン。本番環境に合わせて調整してください
  const xShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(article.translatedTitle || article.title)}&url=${encodeURIComponent(shareUrl)}`;
  const translateUrl = `https://translate.google.com/translate?sl=auto&tl=ja&u=${encodeURIComponent(article.link)}`;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <main className="max-w-3xl mx-auto p-4 md:p-8 space-y-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" /> タイムラインに戻る
        </Link>

        {/* 1. 記事画像 */}
        <div className="relative aspect-video w-full rounded-3xl overflow-hidden shadow-2xl border border-border/50">
          <Image 
            src={article.imageUrl || `https://picsum.photos/seed/${article.id}/1200/600`} 
            alt={article.title}
            fill
            className="object-cover"
            priority
          />
        </div>

        <div className="space-y-6">
          {/* 2. 日本語タイトル */}
          <h1 className="text-3xl md:text-5xl font-black leading-tight tracking-tighter">
            {article.translatedTitle || article.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4">
            {/* 3. タグ */}
            <div className="flex flex-wrap gap-2">
              {article.tags?.map((tag: string) => (
                <Badge key={tag} variant="secondary" className="rounded-full px-3 py-1 font-bold text-xs bg-primary/10 text-primary border-none">
                  #{tag}
                </Badge>
              ))}
            </div>
            
            <Separator orientation="vertical" className="h-4 hidden sm:block" />

            {/* 4. 公開日時（相対表示） */}
            <div className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground">
              <Calendar className="w-4 h-4" />
              {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true, locale: ja })}
            </div>
          </div>
        </div>

        {/* ACE形式セクション */}
        <div className="space-y-6 pt-4">
          {/* 5. ⚡ ACT */}
          <div className="group bg-primary/5 p-6 rounded-[2rem] border border-primary/10 hover:border-primary/30 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
                <Zap className="w-6 h-6 fill-current" />
              </div>
              <h2 className="text-2xl font-black text-primary">ACT <span className="text-xs text-muted-foreground ml-2 font-bold opacity-50">何が起きたか</span></h2>
            </div>
            <p className="text-xl leading-relaxed font-bold">{article.act}</p>
          </div>

          {/* 6. 🔍 CONTEXT */}
          <div className="group bg-card p-6 rounded-[2rem] border border-border hover:border-primary/20 transition-all shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-2xl bg-muted text-foreground shadow-sm">
                <Search className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black">CONTEXT <span className="text-xs text-muted-foreground ml-2 font-bold opacity-50">なぜ重要か</span></h2>
            </div>
            <p className="text-lg leading-relaxed text-foreground/90">{article.context}</p>
          </div>

          {/* 7. 🌊 EFFECT */}
          <div className="group bg-card p-6 rounded-[2rem] border border-border hover:border-primary/20 transition-all shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-2xl bg-muted text-foreground shadow-sm">
                <Waves className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black">EFFECT <span className="text-xs text-muted-foreground ml-2 font-bold opacity-50">何が変わるか</span></h2>
            </div>
            <p className="text-lg leading-relaxed text-foreground/90">{article.effect}</p>
          </div>
        </div>

        <Separator className="my-8" />

        {/* 8, 9, 10. アクションボタン */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Button asChild className="h-14 rounded-full font-black text-lg gap-2 shadow-xl hover:scale-[1.02] transition-transform">
            <a href={article.link} target="_blank" rel="noopener noreferrer">
              記事を読む（外部サイト） <ExternalLink className="w-5 h-5" />
            </a>
          </Button>
          <Button asChild variant="outline" className="h-14 rounded-full font-black text-lg gap-2 border-primary/20 hover:bg-primary/5">
            <a href={translateUrl} target="_blank" rel="noopener noreferrer">
              全文翻訳で読む <Globe className="w-5 h-5" />
            </a>
          </Button>
          <Button asChild variant="secondary" className="h-14 rounded-full font-black text-lg gap-2 sm:col-span-2 bg-black text-white hover:bg-black/90">
            <a href={xShareUrl} target="_blank" rel="noopener noreferrer">
              X（旧Twitter）でシェア <Share2 className="w-5 h-5" />
            </a>
          </Button>
        </div>

        {/* 元のコンテンツのスニペット（任意） */}
        <div className="pt-12 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-4">Original Content Snippet</p>
          <p className="text-sm italic text-muted-foreground max-w-xl mx-auto leading-relaxed">
            "{article.content?.substring(0, 300)}..."
          </p>
        </div>
      </main>
    </div>
  );
}
