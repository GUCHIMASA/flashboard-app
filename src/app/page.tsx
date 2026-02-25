
"use client";

import React, { useState, useMemo, useRef } from 'react';
import { Search, RefreshCw, Sparkles, Bookmark, ArrowRight, Clock, Zap, Loader2, Info, Database, WifiOff, CheckCircle2, Calendar } from 'lucide-react';
import { DashboardSidebar } from '@/components/dashboard/Sidebar';
import { FeedCard } from '@/components/dashboard/FeedCard';
import { AddSourceDialog } from '@/components/dashboard/AddSourceDialog';
import { ThemeToggle } from '@/components/dashboard/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { INITIAL_SOURCES } from './lib/mock-data';
import { Article, Category, FeedSource } from './lib/types';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFirestore, useCollection, useUser } from '@/firebase';
import { collection, addDoc, deleteDoc, doc, serverTimestamp, query, limit } from 'firebase/firestore';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import Image from 'next/image';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { syncRss } from '@/ai/flows/sync-rss-flow';
import { firebaseConfig } from '@/firebase/config';

export default function Home() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const autoplay = useRef(Autoplay({ delay: 6000, stopOnInteraction: true }));
  const [api, setApi] = useState<CarouselApi>();
  
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [selectedSourceName, setSelectedSourceName] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isAddSourceOpen, setIsAddSourceOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const articlesQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'articles'), limit(100));
  }, [db]);
  const { data: firestoreArticles = [], loading: articlesLoading } = useCollection(articlesQuery);

  const bookmarksQuery = useMemo(() => {
    if (!db || !user) return null;
    return collection(db, 'users', user.uid, 'bookmarks');
  }, [db, user]);
  const { data: bookmarkedItems = [] } = useCollection(bookmarksQuery);

  const bookmarkedArticles: Article[] = bookmarkedItems.map(b => ({
    id: b.id,
    title: b.title || '無題',
    content: b.content || '',
    summary: b.summary,
    sourceName: b.sourceName || '不明',
    sourceUrl: '#',
    publishedAt: b.bookmarkedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    category: 'Bookmarks', 
    link: b.link || b.url || '#',
    imageUrl: b.imageUrl || `https://picsum.photos/seed/${b.id}/800/400`
  }));

  const normalizedArticles = useMemo(() => {
    return (firestoreArticles as any[]).map(a => {
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
        imageUrl: a.imageUrl || `https://picsum.photos/seed/${encodeURIComponent(a.title?.substring(0,5) || a.id)}/800/400`
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
      const searchTarget = `${a.title} ${a.content} ${a.sourceName}`.toLowerCase();
      if (searchQuery && !searchTarget.includes(searchQuery.toLowerCase())) return false;
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
    toast({ title: "同期を開始しました", description: "AIが最新情報を翻訳・要約中..." });

    try {
      const result = await syncRss({ sources: allSources });
      toast({ 
        title: result.addedCount > 0 ? "同期完了" : "更新なし", 
        description: `${result.addedCount}件の新しい記事を取得しました。` 
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

  const categoryNames: Record<string, string> = {
    'All': 'すべて',
    'Reliable': '信頼ソース',
    'Discovery': '発見',
    'Bookmarks': '保存済み'
  };

  return (
    <div className="flex min-h-screen w-full">
      <DashboardSidebar 
        activeCategory={activeCategory as any} 
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
              <h2 className="font-headline text-lg md:text-2xl font-black uppercase tracking-tight text-foreground">
                {selectedSourceName || categoryNames[activeCategory] || 'ストリーム'}
              </h2>
              <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", isRefreshing ? "bg-accent animate-spin" : "bg-primary animate-pulse")} />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  最終同期: {latestUpdateDate ? format(latestUpdateDate, 'MM/dd HH:mm') : '--/-- --:--'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                className="pl-10 bg-secondary/50 border-none w-64 rounded-full h-10" 
                placeholder="インサイトを検索..." 
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
          {activeCategory === 'All' && !selectedSourceName && heroArticles.length > 0 && (
            <section className="relative">
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
                        <div className="absolute bottom-0 left-0 p-8 md:p-16 w-full max-w-4xl">
                          <div className="flex items-center gap-3 mb-4">
                            <Badge className="bg-primary/20 backdrop-blur-md text-primary-foreground border-primary/30 py-1 px-3">
                              {article.sourceName}
                            </Badge>
                            <span className="text-xs font-bold text-white/70 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(article.publishedAt), 'MM/dd HH:mm')}
                            </span>
                          </div>
                          <h1 className="font-headline text-2xl md:text-5xl font-black mb-6 tracking-tighter leading-tight text-white drop-shadow-lg">
                            {article.title}
                          </h1>
                          <Button asChild className="rounded-full px-10 h-14 font-black text-lg neo-blur">
                            <a href={article.link} target="_blank" rel="noopener noreferrer">全文を読む <ArrowRight className="ml-2 w-5 h-5" /></a>
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
            <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v)} className="bg-secondary/30 p-1 rounded-full border border-border">
                <TabsList className="bg-transparent h-10">
                  <TabsTrigger value="All" className="rounded-full px-6 data-[state=active]:bg-primary">すべて</TabsTrigger>
                  <TabsTrigger value="Reliable" className="rounded-full px-6 data-[state=active]:bg-primary">信頼ソース</TabsTrigger>
                  <TabsTrigger value="Discovery" className="rounded-full px-6 data-[state=active]:bg-primary">発見</TabsTrigger>
                  <TabsTrigger value="Bookmarks" className="rounded-full px-4 data-[state=active]:bg-primary"><Bookmark className="w-4 h-4" /></TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="flex items-center gap-4">
                <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2 bg-secondary/20 px-4 py-2 rounded-full border border-border/50">
                  <Database className="w-3 h-3 text-primary" />
                  表示中: {filteredArticles.length} / 蓄積: {normalizedArticles.length}
                </div>
                {firebaseConfig.projectId ? (
                  <div className="flex items-center gap-1 text-[10px] font-bold text-green-500 uppercase">
                    <CheckCircle2 className="w-3 h-3" /> オンライン
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-[10px] font-bold text-destructive uppercase">
                    <WifiOff className="w-3 h-3" /> 設定エラー
                  </div>
                )}
              </div>
            </div>

            {articlesLoading && normalizedArticles.length === 0 ? (
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
                <h3 className="text-2xl font-black mb-2 uppercase">
                  {normalizedArticles.length === 0 ? "データベース空状態" : "該当記事なし"}
                </h3>
                <p className="text-muted-foreground text-sm max-w-md mx-auto mb-8">
                  {normalizedArticles.length === 0 
                    ? "Firestoreに記事が見つかりません。同期ボタンを押してAIに最新情報を翻訳・取得させてください。"
                    : `データベースには ${normalizedArticles.length} 件の記事がありますが、現在の条件には一致しません。`}
                </p>
                <Button size="lg" className="rounded-full px-12 font-black h-12" onClick={handleRefresh} disabled={isRefreshing}>
                  {isRefreshing ? "AI同期中..." : "AI同期を開始する"}
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
