
import { Metadata, ResolvingMetadata } from 'next';
import { doc, getDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import Header from '@/components/header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, ExternalLink, Calendar, Share2, Globe, Bookmark } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { TbWaveSawTool } from 'react-icons/tb';
import { IoReorderThree } from 'react-icons/io5';
import { PiWavesBold } from 'react-icons/pi';

type Props = {
  params: Promise<{ id: string }>;
};

// サーバーサイドでのデータ取得（OGP用）
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

  return {
    title: `${article.translatedTitle || article.title} | AI Synapse`,
    description: article.act || article.content?.substring(0, 100),
    openGraph: {
      title: article.translatedTitle || article.title,
      description: article.act || article.content?.substring(0, 100),
      images: [article.imageUrl || ''],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: article.translatedTitle || article.title,
      description: article.act || article.content?.substring(0, 100),
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
        <Button asChild rounded-full>
          <Link href="/">トップへ戻る</Link>
        </Button>
      </div>
    );
  }

  const faviconUrl = `https://www.google.com/s2/favicons?domain=${new URL(article.link).hostname}&sz=64`;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 pb-20">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> タイムラインに戻る
        </Link>

        {/* ヒーローセクション */}
        <div className="relative aspect-[21/9] w-full rounded-[2rem] overflow-hidden shadow-2xl">
          <Image 
            src={article.imageUrl || `https://picsum.photos/seed/${article.id}/1200/600`} 
            alt={article.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          <div className="absolute bottom-6 left-6 right-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-6 h-6 rounded bg-white p-1 flex items-center justify-center">
                <img src={faviconUrl} alt="" className="w-full h-full object-contain" />
              </div>
              <span className="text-white text-sm font-black uppercase tracking-widest">{article.sourceName}</span>
            </div>
            <h1 className="text-2xl md:text-5xl font-black text-white leading-tight">
              {article.translatedTitle || article.title}
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* メインコンテンツ: ACEビュー */}
          <div className="lg:col-span-2 space-y-10">
            <div className="flex items-center gap-6 text-sm text-muted-foreground font-bold">
              <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {format(new Date(article.publishedAt), 'yyyy/MM/dd HH:mm')}</span>
              <span className="flex items-center gap-1.5"><Globe className="w-4 h-4" /> {article.category}</span>
            </div>

            <section className="space-y-8">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-border/50" />
                <Badge variant="outline" className="rounded-full px-4 py-1 text-xs font-black bg-primary/5 border-primary/20 text-primary">QUICK INSIGHT (ACE)</Badge>
                <div className="h-px flex-1 bg-border/50" />
              </div>

              {/* ACT */}
              <div className="group bg-card/50 p-6 rounded-[1.5rem] border border-border/40 hover:border-primary/30 transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
                    <TbWaveSawTool className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-black">ACT <span className="text-xs text-muted-foreground ml-2 font-bold uppercase tracking-tighter opacity-50">何が起きたか</span></h2>
                </div>
                <p className="text-lg leading-relaxed font-bold">{article.act}</p>
              </div>

              {/* CONTEXT */}
              <div className="group bg-card/50 p-6 rounded-[1.5rem] border border-border/40 hover:border-primary/30 transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
                    <IoReorderThree className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-black">CONTEXT <span className="text-xs text-muted-foreground ml-2 font-bold uppercase tracking-tighter opacity-50">なぜ重要か</span></h2>
                </div>
                <p className="text-lg leading-relaxed text-foreground/90">{article.context}</p>
              </div>

              {/* EFFECT */}
              <div className="group bg-card/50 p-6 rounded-[1.5rem] border border-border/40 hover:border-primary/30 transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
                    <PiWavesBold className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-black">EFFECT <span className="text-xs text-muted-foreground ml-2 font-bold uppercase tracking-tighter opacity-50">何が変わるか</span></h2>
                </div>
                <p className="text-lg leading-relaxed text-foreground/90">{article.effect}</p>
              </div>
            </section>

            <Separator className="bg-border/40" />

            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Original Content (Snippet)</h3>
              <p className="text-sm leading-relaxed text-muted-foreground italic">
                {article.content}
              </p>
            </div>
          </div>

          {/* サイドバー: アクション */}
          <div className="space-y-6">
            <div className="sticky top-24 space-y-4">
              <div className="bg-card p-6 rounded-[1.5rem] border border-border/40 space-y-4">
                <h4 className="font-black text-sm uppercase tracking-widest mb-2">アクション</h4>
                <Button asChild className="w-full h-12 rounded-full font-black text-base shadow-lg hover:shadow-primary/20 transition-all gap-2">
                  <a href={article.link} target="_blank" rel="noopener noreferrer">
                    ソース元で全文を読む <ExternalLink className="w-5 h-5" />
                  </a>
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="rounded-full h-12 font-bold gap-2">
                    <Bookmark className="w-4 h-4" /> 保存
                  </Button>
                  <Button variant="outline" className="rounded-full h-12 font-bold gap-2">
                    <Share2 className="w-4 h-4" /> 共有
                  </Button>
                </div>
              </div>

              {article.tags && article.tags.length > 0 && (
                <div className="bg-card p-6 rounded-[1.5rem] border border-border/40">
                  <h4 className="font-black text-sm uppercase tracking-widest mb-4">関連タグ</h4>
                  <div className="flex flex-wrap gap-2">
                    {article.tags.map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="rounded-full px-3 py-1 font-bold text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
