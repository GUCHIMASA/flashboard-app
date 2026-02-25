
"use client";

import React, { useState, useMemo, useRef } from 'react';
import { Bookmark, ArrowRight, Calendar, Info, Database, Tag as TagIcon, X } from 'lucide-react';
import { DashboardSidebar } from '@/components/dashboard/Sidebar';
import { FeedCard } from '@/components/dashboard/FeedCard';
import { AddSourceDialog } from '@/components/dashboard/AddSourceDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { INITIAL_SOURCES } from './lib/mock-data';
import { Article, Category, FeedSource } from './lib/types';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, addDoc, deleteDoc, doc, serverTimestamp, query, limit } from 'firebase/firestore';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import Image from 'next/image';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { syncRss } from '@/ai/flows/sync-rss-flow';
import Header from '@/components/header';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

// 管理者のメールアドレス
const ADMIN_EMAIL = 'kawa_guchi_masa_hiro@yahoo.co.jp';

const AVAILABLE_TAGS = [
  "新モデル", "ツール", "研究・論文", "ビジネス", "規制・政策", "セキュリティ",
  "OpenAI", "Anthropic", "Google", "Meta", "Microsoft", "その他企業",
  "新リリース", "資金調達", "提携", "障害"
];

export default function Home() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const autoplay = useRef(Autoplay({ delay: 6000, stopOnInteraction: true }));
  const [api, setApi] = useState<CarouselApi>();
  
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [selectedSourceName, setSelectedSourceName] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isAddSourceOpen, setIsAddSourceOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 管理者判定
  const isAdmin = useMemo(() => {
    return user && user.email === ADMIN_EMAIL;
  }, [user]);

  const sourcesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, 'users', user.uid, 'sources');
  }, [db, user]);
  const { data: customSources } = useCollection(sourcesQuery);

  const allSources = useMemo(() => [
    ...INITIAL_SOURCES, 
    ...(customSources || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      url: s.url,
      category: 'Custom' as Category
    }))
  ], [customSources]);

  const articlesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'articles'), limit(100));
  }, [db]);
  const { data: firestoreArticles, loading: articlesLoading } = useCollection(articlesQuery);

  const bookmarksQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, 'users', user.uid, 'bookmarks');
  }, [db, user]);
  const { data: bookmarkedItems } = useCollection(bookmarksQuery);

  const bookmarkedArticles: Article[] = (bookmarkedItems || []).map((b: any) => ({
    id: b.id,
    title: b.title || '無題',
    content: b.content || '',
    summary: b.summary,
    sourceName: b.sourceName || '不明',
    sourceUrl: '#',
    publishedAt: b.bookmarkedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    category: 'Bookmarks', 
    link: b.link || b.url || '#',
    imageUrl: b.imageUrl || `https://picsum.photos/seed/${b.id}/800/400`,
    tags: b.tags || []
  }));

  const normalizedArticles = useMemo(() => {
    return ((firestoreArticles as any[]) || []).map(a => {
      let dateStr = a.publishedAt;
      if (!dateStr && a.createdAt?.toDate) {
        dateStr = a.createdAt.toDate().toISOString();
      }
      if (!dateStr) dateStr = new Date().toISOString();

      return {
        ...a,
        id: a.id,
        title: a.title || '無題',
        link: a.link || a.url || '#',
        category: a.category || 'Reliable',
        sourceName: a.sourceName || '不明',
        publishedAt: dateStr,
        imageUrl: a.imageUrl || `https://picsum.photos/seed/${encodeURIComponent(a.title?.substring(0,5) || a.id)}/800/400`,
        tags: a.tags || []
      } as Article;
    });
  }, [firestoreArticles]);

  const displayArticles = activeCategory === 'Bookmarks' ? bookmarkedArticles : normalizedArticles;

  const sortedArticles = useMemo(() => {
    return [...displayArticles].sort((a, b) => {
      const dateA = new Date(a.publishedAt).getTime();
      const dateB = new Date(b.publishedAt).getTime();
      return (dateB || 0) - (dateA || 0);
    });
  }, [displayArticles]);

  const filteredArticles = useMemo(() => {
    return sortedArticles.filter(a => {
      if (activeCategory !== 'All' && activeCategory !== 'Bookmarks') {
        if (a.category?.toLowerCase() !== activeCategory.toLowerCase()) return false;
      }
      if (selectedSourceName && a.sourceName !== selectedSourceName) return false;
      if (selectedTag && !a.tags?.includes(selectedTag)) return false;
      const searchTarget = `${a.title} ${a.content} ${a.sourceName}`.toLowerCase();
      if (searchQuery && !searchTarget.includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [sortedArticles, activeCategory, selectedSourceName, selectedTag, searchQuery]);

  const heroArticles = useMemo(() => {
    return sortedArticles.slice(0, 5);
  }, [sortedArticles]);

  const handleRefresh = async () => {
    if (isRefreshing || !isAdmin) return;
    setIsRefreshing(true);
    toast({ title: "同期を開始しました", description: "AIが最新情報を翻訳・要約・タグ付け中..." });

    try {
      const result = await syncRss({ 
        sources: allSources,
        requesterEmail: user?.email || ''
      });
      toast({ 
        title: result.addedCount > 0 || result.updatedCount > 0 ? "同期完了" : "更新なし", 
        description: `${result.addedCount + result.updatedCount}件の記事を処理しました。` 
      });
    } catch (error: any) {
      toast({ variant: "destructive", title: "同期エラー", description: error.message });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSourceSelect = (source: FeedSource | 'All') => {
    if (source === 'All') {
      setActiveCategory('All');
      setSelectedSourceName(null);
    } else {
      setActiveCategory(source.category);
      setSelectedSourceName(source.name);
    }
  };

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden">
      <DashboardSidebar 
        activeCategory={activeCategory as any} 
        selectedSourceName={selectedSourceName}
        onSelectSource={handleSourceSelect}
        onDeleteSource={(id) => {
          if (db && user) {
            deleteDoc(doc(db, 'users', user.uid, 'sources', id));
          }
        }}
        sources={allSources}
        onAddSource={() => user ? setIsAddSourceOpen(true) : toast({ variant: "destructive", title: "ログインが必要です", description: "カスタムソースを追加するにはログインしてください。" })}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <Header />
        <div className="flex-1 p-4 md:p-10 space-y-10 max-w-full md:max-w-[1800px] mx-auto w-full overflow-x-hidden">
          {activeCategory === 'All' && !selectedSourceName && !selectedTag && heroArticles.length > 0 && (
            <section className="relative overflow-hidden rounded-[2.5rem]">
              <Carousel className="w-full" opts={{ loop: true }} plugins={[autoplay.current]} setApi={setApi}>
                <CarouselContent>
                  {heroArticles.map((article) => (
                    <CarouselItem key={article.id}>
                      <div className="relative h-[350px] md:h-[550px] w-full overflow-hidden rounded-[2.5rem] shadow-2xl group">
                        <Image 
                          src={article.imageUrl || `https://picsum.photos/seed/${article.id}/1200/800`} 
                          alt={article.title}
                          fill
                          className="object-cover transition-transform duration-[10s] group-hover:scale-110"
                          priority
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                        <div className="absolute bottom-0 left-0 p-6 md:p-16 w-full max-w-4xl">
                          <div className="flex items-center gap-3 mb-4">
                            <Badge className="bg-primary/20 backdrop-blur-md text-primary-foreground border-primary/30 py-1 px-3">
                              {article.sourceName}
                            </Badge>
                            <span className="text-xs font-bold text-white/70 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(article.publishedAt), 'MM/dd HH:mm')}
                            </span>
                          </div>
                          <h1 className="font-headline text-xl md:text-5xl font-black mb-6 tracking-tighter leading-tight text-white drop-shadow-lg line-clamp-2 md:line-clamp-none">
                            {article.title}
                          </h1>
                          <Button asChild className="rounded-full px-8 md:px-10 h-12 md:h-14 font-black text-sm md:text-lg neo-blur">
                            <a href={article.link} target="_blank" rel="noopener noreferrer">全文を読む <ArrowRight className="ml-2 w-4 h-4 md:w-5 md:h-5" /></a>
                          </Button>
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            </section>
          )}

          <section className="w-full">
            <div className="mb-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v)} className="bg-secondary/30 p-1 rounded-full border border-border shrink-0 inline-flex">
                  <TabsList className="bg-transparent h-10">
                    <TabsTrigger value="All" className="rounded-full px-6 data-[state=active]:bg-primary">すべて</TabsTrigger>
                    <TabsTrigger value="Reliable" className="rounded-full px-6 data-[state=active]:bg-primary whitespace-nowrap">信頼ソース</TabsTrigger>
                    <TabsTrigger value="Discovery" className="rounded-full px-6 data-[state=active]:bg-primary">発見</TabsTrigger>
                    <TabsTrigger value="Bookmarks" className="rounded-full px-4 data-[state=active]:bg-primary"><Bookmark className="w-4 h-4" /></TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              
              <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                <div className="flex items-center gap-2 bg-secondary/20 px-4 py-2 rounded-full border border-border/50 text-[10px] font-black text-muted-foreground whitespace-nowrap">
                  <Database className="w-3 h-3 text-primary" />
                  {filteredArticles.length} / {normalizedArticles.length}
                </div>
                {isAdmin && (
                  <Button variant="outline" size="sm" className="rounded-full h-9 px-4 font-bold border-primary/30 hover:bg-primary/10 whitespace-nowrap" onClick={handleRefresh} disabled={isRefreshing}>
                    {isRefreshing ? "AI同期中..." : "AI同期"}
                  </Button>
                )}
              </div>
            </div>

            <div className="mb-8 flex items-center gap-3 w-full">
              <div className="flex items-center gap-2 text-muted-foreground shrink-0">
                <TagIcon className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">タグ絞り込み:</span>
              </div>
              <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex gap-2 pb-2">
                  {selectedTag && (
                    <Badge 
                      variant="default" 
                      className="cursor-pointer px-4 py-1.5 rounded-full bg-primary flex items-center gap-2"
                      onClick={() => setSelectedTag(null)}
                    >
                      #{selectedTag} <X className="w-3 h-3" />
                    </Badge>
                  )}
                  {AVAILABLE_TAGS.filter(t => t !== selectedTag).map(tag => (
                    <Badge 
                      key={tag} 
                      variant="outline" 
                      className="cursor-pointer px-4 py-1.5 rounded-full border-white/10 hover:bg-white/5 transition-colors"
                      onClick={() => setSelectedTag(tag)}
                    >
                      #{tag}
                    </Badge>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" className="h-1.5" />
              </ScrollArea>
            </div>

            {articlesLoading && normalizedArticles.length === 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="aspect-[4/5] rounded-[2rem] bg-secondary/50 animate-pulse" />
                ))}
              </div>
            ) : filteredArticles.length > 0 ? (
              /* 
                 モバイル表示時の「スタッキング（重なり）スクロール」エフェクト 
                 デスクトップでは通常のグリッドレイアウトを維持
              */
              <div className="flex flex-col sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 relative">
                {filteredArticles.map((article, index) => (
                  <div 
                    key={article.id} 
                    className="sticky top-20 sm:relative sm:top-0 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4" 
                    style={{ 
                      animationDelay: `${index * 50}ms`,
                      marginTop: index > 0 ? '-8rem' : '0', // モバイルでの重なりエフェクト
                      zIndex: index + 1 
                    }}
                  >
                    <div className="bg-background rounded-[2rem] shadow-2xl sm:shadow-none">
                      <FeedCard article={article} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 md:py-32 text-center glass-panel rounded-[2rem] md:rounded-[3rem]">
                <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary/10 text-primary mb-6 animate-bounce">
                  <Info className="w-6 h-6 md:w-8 md:h-8" />
                </div>
                <h3 className="text-xl md:text-2xl font-black mb-2 uppercase">
                  該当記事なし
                </h3>
                <p className="text-muted-foreground text-sm max-w-xs md:max-w-md mx-auto mb-8 px-4">
                  {selectedTag ? `タグ「#${selectedTag}」に一致する記事はありません。` : "現在の条件に一致する記事は見つかりませんでした。"}
                </p>
                {(selectedTag || searchQuery || activeCategory !== 'All') && (
                  <Button variant="outline" className="rounded-full px-8" onClick={() => { setActiveCategory('All'); setSelectedTag(null); setSearchQuery(''); }}>
                    すべての条件をクリア
                  </Button>
                )}
              </div>
            )}
          </section>
        </div>
      </main>

      <AddSourceDialog 
        open={isAddSourceOpen} 
        onOpenChange={setIsAddSourceOpen} 
        onAdd={(s) => {
          if (!user) {
            toast({ variant: "destructive", title: "ログインが必要です", description: "カスタムソースを追加するにはログインしてください。" });
            return;
          }
          if (db) {
            addDoc(collection(db, 'users', user.uid, 'sources'), { ...s, createdAt: serverTimestamp() });
          }
        }}
      />
    </div>
  );
}

