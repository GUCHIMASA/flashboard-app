"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, RefreshCw, Filter, Sparkles, Bookmark, ArrowRight, Clock, Zap, Loader2, AlertCircle, Info } from 'lucide-react';
import { DashboardSidebar } from '@/components/dashboard/Sidebar';
import { FeedCard } from '@/components/dashboard/FeedCard';
import { AddSourceDialog } from '@/components/dashboard/AddSourceDialog';
import { ThemeToggle } from '@/components/dashboard/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { INITIAL_SOURCES } from './lib/mock-data';
import { Article, Category, FeedSource } from './lib/types';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFirestore, useCollection, useUser } from '@/firebase';
import { collection, addDoc, deleteDoc, doc, serverTimestamp, query, limit } from 'firebase/firestore';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import Image from 'next/image';
import { format, formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { syncRss } from '@/ai/flows/sync-rss-flow';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export default function Home() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const autoplay = useRef(Autoplay({ delay: 6000, stopOnInteraction: true }));
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  
  const [activeCategory, setActiveCategory] = useState<Category | 'All' | 'Bookmarks'>('All');
  const [selectedSourceName, setSelectedSourceName] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isAddSourceOpen, setIsAddSourceOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!api) return;
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  // カスタムソースの取得
  const sourcesQuery = useMemo(() => {
    if (!db || !user) return null;
    return collection(db, 'users', user.uid, 'sources');
  }, [db, user]);
  const { data: customSources = [] } = useCollection(sourcesQuery);

  const allSources = useMemo(() => [
    ...INITIAL_SOURCES, 
    ...customSources.map(s => ({
      id: s.id,
      name: s.name,
      url: s.url,
      category: 'Custom' as Category
    }))
  ], [customSources]);

  // 記事の取得 (インデックスエラー回避のため orderBy を使わずクライアントでソート)
  const articlesQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'articles'), limit(50));
  }, [db]);
  const { data: firestoreArticles = [], loading: articlesLoading, error: articlesError } = useCollection(articlesQuery);

  // ブックマークの取得
  const bookmarksQuery = useMemo(() => {
    if (!db || !user) return null;
    return collection(db, 'users', user.uid, 'bookmarks');
  }, [db, user]);
  const { data: bookmarkedItems = [] } = useCollection(bookmarksQuery);

  const bookmarkedArticles: Article[] = bookmarkedItems.map(b => ({
    id: b.id,
    title: b.title,
    content: b.content || '',
    summary: b.summary,
    sourceName: b.sourceName,
    sourceUrl: '#',
    publishedAt: b.bookmarkedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    category: 'Reliable', 
    link: b.url || b.link || '#',
    imageUrl: b.imageUrl || 'https://picsum.photos/seed/placeholder/800/400'
  }));

  // データ整形 (url/link フィールドの揺らぎを吸収)
  const normalizedArticles = useMemo(() => {
    return (firestoreArticles as any[]).map(a => ({
      ...a,
      link: a.link || a.url || '#', // urlフィールドが使われている場合の互換性
      publishedAt: a.publishedAt || a.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
    })) as Article[];
  }, [firestoreArticles]);

  const displayArticles = activeCategory === 'Bookmarks' ? bookmarkedArticles : normalizedArticles;

  // 最新順にソート
  const sortedArticles = useMemo(() => {
    return [...displayArticles].sort((a, b) => {
      const dateA = new Date(a.publishedAt).getTime();
      const dateB = new Date(b.publishedAt).getTime();
      return isNaN(dateB) || isNaN(dateA) ? 0 : dateB - dateA;
    });
  }, [displayArticles]);

  const filteredArticles = useMemo(() => {
    return sortedArticles.filter(a => {
      if (activeCategory !== 'All' && activeCategory !== 'Bookmarks' && a.category !== activeCategory) {
        return false;
      }
      if (selectedSourceName && a.sourceName !== selectedSourceName) {
        return false;
      }
      const searchTarget = `${a.title} ${a.content} ${a.sourceName}`.toLowerCase();
      if (searchQuery && !searchTarget.includes(searchQuery.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [sortedArticles, activeCategory, selectedSourceName, searchQuery]);

  const latestUpdateDate = useMemo(() => {
    if (sortedArticles.length === 0) return null;
    return new Date(sortedArticles[0].publishedAt);
  }, [sortedArticles]);

  const heroArticles = useMemo(() => {
    return sortedArticles.slice(0, 5);
  }, [sortedArticles]);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    
    toast({
      title: "同期を開始しました",
      description: "AIが各ソースから最新情報を解析中...",
    });

    try {
      const result = await syncRss({ sources: allSources });
      if (result.addedCount > 0) {
        toast({
          title: "同期完了",
          description: `${result.addedCount}件の新しい記事を取得しました。`,
        });
      } else if (result.errors.length > 0) {
        toast({
          variant: "destructive",
          title: "一部でエラーが発生しました",
          description: result.errors[0],
        });
      } else {
        toast({
          title: "更新なし",
          description: "新しい記事は見つかりませんでした。",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "同期エラー",
        description: error.message,
      });
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
    <div className="flex min-h-screen w-full">
      <DashboardSidebar 
        activeCategory={activeCategory} 
        selectedSourceName={selectedSourceName}
        onSelectSource={handleSourceSelect}
        onDeleteSource={(id) => deleteDoc(doc(db!, 'users', user!.uid, 'sources', id))}
        sources={allSources}
        onAddSource={() => setIsAddSourceOpen(true)}
      />

      <main className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-40 w-full glass-panel px-4 md:px-8 h-16 md:h-24 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="hover:bg-primary/10" />
            <div className="flex flex-col">
              <h2 className="font-headline text-lg md:text-2xl font-black uppercase tracking-tight">
                {selectedSourceName || (activeCategory === 'Bookmarks' ? 'Vault' : 'Stream')}
              </h2>
              <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", isRefreshing ? "bg-accent animate-spin" : "bg-primary animate-pulse")} />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  SYNC: {latestUpdateDate ? format(latestUpdateDate, 'HH:mm') : '--:--'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                className="pl-10 bg-secondary/50 border-none w-64 rounded-full h-10" 
                placeholder="Search Insights..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <ThemeToggle />
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-full h-10 w-10 border-white/10"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
            </Button>
          </div>
        </header>

        <div className="flex-1 p-4 md:p-10 space-y-10 max-w-[1800px] mx-auto w-full">
          {articlesError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Firestore Error</AlertTitle>
              <AlertDescription>{articlesError.message}</AlertDescription>
            </Alert>
          )}

          {activeCategory === 'All' && !selectedSourceName && heroArticles.length > 0 && (
            <section className="relative">
              <Carousel className="w-full" opts={{ loop: true }} plugins={[autoplay.current]} setApi={setApi}>
                <CarouselContent>
                  {heroArticles.map((article) => (
                    <CarouselItem key={article.id}>
                      <div className="relative h-[300px] md:h-[500px] w-full overflow-hidden rounded-[2.5rem] shadow-2xl group">
                        <Image 
                          src={article.imageUrl || 'https://picsum.photos/seed/placeholder/1200/800'} 
                          alt={article.title}
                          fill
                          className="object-cover transition-transform duration-[10s] group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
                        <div className="absolute bottom-0 left-0 p-8 md:p-16 w-full max-w-4xl">
                          <h1 className="font-headline text-2xl md:text-5xl font-black mb-4 tracking-tighter leading-tight">
                            {article.title}
                          </h1>
                          <Button asChild className="rounded-full px-8 h-12 font-bold">
                            <a href={article.link} target="_blank" rel="noopener noreferrer">READ INSIGHT</a>
                          </Button>
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            </section>
          )}

          <section>
            <div className="mb-8 flex items-center justify-between">
              <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as any)} className="bg-secondary/30 p-1 rounded-full border border-border">
                <TabsList className="bg-transparent h-10">
                  <TabsTrigger value="All" className="rounded-full px-6 data-[state=active]:bg-primary">All</TabsTrigger>
                  <TabsTrigger value="Reliable" className="rounded-full px-6 data-[state=active]:bg-primary">Reliable</TabsTrigger>
                  <TabsTrigger value="Discovery" className="rounded-full px-6 data-[state=active]:bg-primary">Discovery</TabsTrigger>
                  <TabsTrigger value="Bookmarks" className="rounded-full px-4 data-[state=active]:bg-primary"><Bookmark className="w-4 h-4" /></TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <Filter className="w-3 h-3 text-primary" />
                {filteredArticles.length} INSIGHTS
              </div>
            </div>

            {articlesLoading && sortedArticles.length === 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="aspect-[4/5] rounded-[2rem] bg-secondary/50 animate-pulse" />
                ))}
              </div>
            ) : filteredArticles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredArticles.map((article, index) => (
                  <div key={article.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${index * 50}ms` }}>
                    <FeedCard article={article} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-32 text-center glass-panel rounded-[3rem]">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 text-primary mb-6 animate-bounce">
                  <Info className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black mb-2 uppercase">No Data Found</h3>
                <p className="text-muted-foreground text-sm max-w-md mx-auto mb-8">
                  Firestoreには {sortedArticles.length} 件の記事がありますが、現在のフィルターには一致しません。<br />
                  「INITIALIZE SYNC」を押して最新情報を取得してください。
                </p>
                <Button size="lg" className="rounded-full px-12 font-black h-12" onClick={handleRefresh} disabled={isRefreshing}>
                  {isRefreshing ? "SYNCHRONIZING..." : "INITIALIZE SYNC"}
                </Button>
              </div>
            )}
          </section>
        </div>
      </main>

      <AddSourceDialog 
        open={isAddSourceOpen} 
        onOpenChange={setIsAddSourceOpen} 
        onAdd={(s) => addDoc(collection(db!, 'users', user!.uid, 'sources'), { ...s, createdAt: serverTimestamp() })}
      />
    </div>
  );
}
