
"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
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
import { collection, addDoc, deleteDoc, doc, serverTimestamp, query, limit, orderBy } from 'firebase/firestore';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import Image from 'next/image';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { syncRss } from '@/ai/flows/sync-rss-flow';
import Header from '@/components/header';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

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

  // アクティブな記事のIDを管理
  const [activeArticleId, setActiveArticleId] = useState<string | null>(null);
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

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
    return query(collection(db, 'articles'), orderBy('publishedAt', 'desc'), limit(100));
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

  const filteredArticles = useMemo(() => {
    return displayArticles.filter(a => {
      if (activeCategory !== 'All' && activeCategory !== 'Bookmarks') {
        if (a.category?.toLowerCase() !== activeCategory.toLowerCase()) return false;
      }
      if (selectedSourceName && a.sourceName !== selectedSourceName) return false;
      if (selectedTag && !a.tags?.includes(selectedTag)) return false;
      const searchTarget = `${a.title} ${a.content} ${a.sourceName}`.toLowerCase();
      if (searchQuery && !searchTarget.includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [displayArticles, activeCategory, selectedSourceName, selectedTag, searchQuery]);

  const heroArticles = useMemo(() => {
    return normalizedArticles.slice(0, 5);
  }, [normalizedArticles]);

  // スクロール検知で真ん中のカードをアクティブにする
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-40% 0% -40% 0%', // 画面中央付近を検知範囲にする
      threshold: 0
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const articleId = entry.target.getAttribute('data-article-id');
          if (articleId) setActiveArticleId(articleId);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    
    // 現在表示されている全てのカードを監視対象にする
    Object.values(cardRefs.current).forEach(el => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [filteredArticles]);

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
    <div className="flex min-h-screen w-full bg-background overflow-x-hidden">
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

      <main className="flex-1 flex flex-col min-w-0 max-w-full overflow-x-hidden">
        <Header />
        <div className="flex-1 p-4 md:p-8 space-y-8 max-w-[1600px] mx-auto w-full">
          {activeCategory === 'All' && !selectedSourceName && !selectedTag && heroArticles.length > 0 && (
            <section className="relative overflow-hidden rounded-3xl shadow-xl">
              <Carousel className="w-full" opts={{ loop: true }} plugins={[autoplay.current]} setApi={setApi}>
                <CarouselContent>
                  {heroArticles.map((article) => (
                    <CarouselItem key={article.id}>
                      <div className="relative h-[300px] md:h-[450px] w-full overflow-hidden">
                        <Image 
                          src={article.imageUrl || `https://picsum.photos/seed/${article.id}/1200/800`} 
                          alt={article.title}
                          fill
                          className="object-cover"
                          priority
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute bottom-0 left-0 p-6 md:p-12 w-full">
                          <div className="flex items-center gap-3 mb-3">
                            <Badge className="bg-primary border-none">{article.sourceName}</Badge>
                            <span className="text-xs text-white/70 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(article.publishedAt), 'MM/dd HH:mm')}
                            </span>
                          </div>
                          <h1 className="text-2xl md:text-4xl font-black mb-4 text-white line-clamp-2 leading-tight">
                            {article.title}
                          </h1>
                          <Button asChild className="rounded-full px-6 h-10 font-bold">
                            <a href={article.link} target="_blank" rel="noopener noreferrer">
                              詳しく読む <ArrowRight className="ml-2 w-4 h-4" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            </section>
          )}

          <section className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v)} className="bg-muted p-1 rounded-full">
                  <TabsList className="bg-transparent h-9">
                    <TabsTrigger value="All" className="rounded-full px-4">すべて</TabsTrigger>
                    <TabsTrigger value="Reliable" className="rounded-full px-4">信頼</TabsTrigger>
                    <TabsTrigger value="Discovery" className="rounded-full px-4">発見</TabsTrigger>
                    <TabsTrigger value="Bookmarks" className="rounded-full px-3"><Bookmark className="w-4 h-4" /></TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="bg-muted px-3 py-1.5 rounded-full text-[10px] font-bold text-muted-foreground flex items-center gap-2">
                  <Database className="w-3 h-3 text-primary" />
                  {filteredArticles.length} 件
                </div>
                {isAdmin && (
                  <Button variant="outline" size="sm" className="rounded-full h-9 border-primary/30 hover:bg-primary/5" onClick={handleRefresh} disabled={isRefreshing}>
                    {isRefreshing ? "同期中..." : "最新記事を取得"}
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <TagIcon className="w-4 h-4 text-muted-foreground shrink-0" />
              <ScrollArea className="w-full">
                <div className="flex gap-2 pb-2">
                  {selectedTag && (
                    <Badge variant="default" className="cursor-pointer bg-primary gap-1" onClick={() => setSelectedTag(null)}>
                      #{selectedTag} <X className="w-3 h-3" />
                    </Badge>
                  )}
                  {AVAILABLE_TAGS.filter(t => t !== selectedTag).map(tag => (
                    <Badge 
                      key={tag} 
                      variant="outline" 
                      className="cursor-pointer hover:bg-primary/10 border-muted"
                      onClick={() => setSelectedTag(tag)}
                    >
                      #{tag}
                    </Badge>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>

            {articlesLoading && filteredArticles.length === 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-64 rounded-2xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : filteredArticles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredArticles.map((article) => (
                  <div 
                    key={article.id} 
                    ref={el => { cardRefs.current[article.id] = el }}
                    data-article-id={article.id}
                    onClick={() => setActiveArticleId(article.id)}
                    className="cursor-pointer transition-transform duration-300"
                  >
                    <FeedCard 
                      article={article} 
                      isActive={activeArticleId === article.id}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center bg-muted/30 rounded-3xl border border-dashed border-muted">
                <Info className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-bold mb-2">該当する記事はありません</h3>
                <p className="text-muted-foreground mb-6">条件を変更してお試しください。</p>
                <Button variant="outline" className="rounded-full" onClick={() => { setActiveCategory('All'); setSelectedTag(null); setSearchQuery(''); }}>
                  フィルターをクリア
                </Button>
              </div>
            )}
          </section>
        </div>
      </main>

      <AddSourceDialog 
        open={isAddSourceOpen} 
        onOpenChange={setIsAddSourceOpen} 
        onAdd={(s) => {
          if (!user) return;
          addDoc(collection(db, 'users', user.uid, 'sources'), { ...s, createdAt: serverTimestamp() });
        }}
      />
    </div>
  );
}
