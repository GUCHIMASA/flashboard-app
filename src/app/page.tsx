"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, RefreshCw, Filter, Sparkles, Bookmark, ArrowRight, Clock, Zap } from 'lucide-react';
import { DashboardSidebar } from '@/components/dashboard/Sidebar';
import { FeedCard } from '@/components/dashboard/FeedCard';
import { AdCard } from '@/components/dashboard/AdCard';
import { AddSourceDialog } from '@/components/dashboard/AddSourceDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { INITIAL_SOURCES } from './lib/mock-data';
import { Article, Category, FeedSource } from './lib/types';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFirestore, useCollection, useUser } from '@/firebase';
import { collection, addDoc, deleteDoc, doc, serverTimestamp, query, orderBy, limit } from 'firebase/firestore';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import Image from 'next/image';
import { format, formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { syncRss } from '@/ai/flows/sync-rss-flow';

export default function Home() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const autoplay = useRef(Autoplay({ delay: 6000, stopOnInteraction: true }));
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  
  const [activeCategory, setActiveCategory] = useState<Category | 'All' | 'Bookmarks'>('All');
  const [selectedSourceName, setSelectedSourceName] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isAddSourceOpen, setIsAddSourceOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!api) return;
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

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
    return query(collection(db, 'articles'), orderBy('publishedAt', 'desc'), limit(50));
  }, [db]);
  const { data: firestoreArticles = [], loading: articlesLoading } = useCollection(articlesQuery);

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
    link: b.url,
    imageUrl: b.imageUrl || 'https://picsum.photos/seed/placeholder/800/400'
  }));

  const displayArticles = activeCategory === 'Bookmarks' ? bookmarkedArticles : (firestoreArticles as Article[]);

  const filteredArticles = useMemo(() => {
    return displayArticles
      .filter(a => {
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
  }, [displayArticles, activeCategory, selectedSourceName, searchQuery]);

  const latestUpdateDate = useMemo(() => {
    if (filteredArticles.length === 0) return null;
    return new Date(filteredArticles[0].publishedAt);
  }, [filteredArticles]);

  const heroArticles = useMemo(() => {
    return (firestoreArticles as Article[]).slice(0, 5);
  }, [firestoreArticles]);

  const handleAddSource = (newSource: Omit<FeedSource, 'id'>) => {
    if (!db || !user) return;
    addDoc(collection(db, 'users', user.uid, 'sources'), {
      ...newSource,
      createdAt: serverTimestamp(),
    });
    toast({
      title: "ソースを追加しました",
      description: `${newSource.name}が登録されました。`,
    });
  };

  const handleDeleteSource = (sourceId: string) => {
    if (!db || !user) return;
    deleteDoc(doc(db, 'users', user.uid, 'sources', sourceId));
    toast({
      title: "ソースを削除しました",
    });
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    
    try {
      const result = await syncRss({ sources: allSources });
      toast({
        title: "同期が完了しました",
        description: `${result.addedCount}件の最新情報を取得しました。`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "同期エラー",
        description: "接続を確認してください。",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCategoryChange = (val: string) => {
    setActiveCategory(val as any);
    setSelectedSourceName(null);
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

  const headerTitle = useMemo(() => {
    if (activeCategory === 'Bookmarks') return 'ブックマーク';
    if (selectedSourceName) return selectedSourceName;
    const labels: Record<string, string> = {
      'All': 'タイムライン',
      'Reliable': '信頼済み',
      'Discovery': '発見',
      'Custom': 'カスタム'
    };
    return labels[activeCategory] || 'タイムライン';
  }, [activeCategory, selectedSourceName]);

  return (
    <div className="flex min-h-screen w-full">
      <DashboardSidebar 
        activeCategory={activeCategory} 
        selectedSourceName={selectedSourceName}
        onSelectSource={handleSourceSelect}
        onDeleteSource={handleDeleteSource}
        sources={allSources}
        onAddSource={() => setIsAddSourceOpen(true)}
      />

      <main className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-40 w-full glass-panel px-3 md:px-6 h-14 md:h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 md:gap-5">
            <SidebarTrigger className="hover:bg-white/10 transition-colors" />
            <div className="h-8 w-px bg-white/10 hidden xs:block" />
            <div className="flex flex-col">
              <h2 className="font-headline text-sm md:text-xl font-black text-foreground truncate uppercase tracking-tight">
                {headerTitle}
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.6)]" />
                <span className="text-[8px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  LATEST UPDATE: {latestUpdateDate ? format(latestUpdateDate, 'HH:mm') : '--:--'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-1 justify-end max-w-xl">
            <div className="relative w-full max-w-[120px] xs:max-w-xs group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                className="pl-10 bg-white/5 border-white/5 focus-visible:ring-1 focus-visible:ring-primary h-9 md:h-11 rounded-full transition-all hover:bg-white/10 text-xs md:text-sm" 
                placeholder="インサイトを検索..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-9 w-9 md:h-11 md:w-11 border-white/5 bg-white/5 rounded-full hover:bg-primary/20 hover:text-primary transition-all relative shrink-0"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 md:w-5 md:h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </header>

        <div className="flex-1 p-2.5 md:p-8 space-y-6 md:space-y-12 max-w-[1600px] mx-auto w-full">
          {activeCategory === 'All' && !selectedSourceName && !searchQuery && heroArticles.length > 0 && (
            <section className="relative">
              <Carousel 
                className="w-full" 
                opts={{ loop: true }}
                plugins={[autoplay.current]}
                setApi={setApi}
              >
                <CarouselContent>
                  {heroArticles.map((article) => (
                    <CarouselItem key={article.id}>
                      <div className="relative h-[220px] xs:h-[320px] md:h-[600px] w-full overflow-hidden rounded-[2rem] md:rounded-[3rem] shadow-2xl group/hero">
                        <Image 
                          src={article.imageUrl || 'https://picsum.photos/seed/placeholder/1200/800'} 
                          alt={article.title}
                          fill
                          className="object-cover transition-transform duration-[10s] group-hover/hero:scale-110"
                          priority
                          data-ai-hint="futuristic technology"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent hidden md:block" />
                        
                        <div className="absolute bottom-0 left-0 p-5 md:p-20 w-full md:max-w-5xl">
                          <div className="flex items-center gap-3 mb-3 md:mb-6 animate-in slide-in-from-bottom duration-500">
                            <div className="inline-flex items-center gap-2 bg-primary px-3 py-1 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-white">
                              <Zap className="w-3 h-3" />
                              FEATURED INSIGHT
                            </div>
                            <div className="text-white/60 text-[8px] md:text-[10px] font-bold uppercase tracking-widest">
                              {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true, locale: ja })}
                            </div>
                          </div>
                          <h1 className="font-headline text-xl xs:text-3xl md:text-6xl font-black mb-3 md:mb-6 tracking-tighter leading-[1] text-white animate-in slide-in-from-bottom duration-700 delay-100">
                            {article.title}
                          </h1>
                          <p className="text-white/70 text-xs md:text-xl mb-6 md:mb-10 line-clamp-2 max-w-3xl font-medium hidden xs:block animate-in slide-in-from-bottom duration-700 delay-200">
                            {article.summary || article.content}
                          </p>
                          <div className="flex items-center gap-4 animate-in slide-in-from-bottom duration-700 delay-300">
                            <Button asChild size="lg" className="bg-white text-black hover:bg-primary hover:text-white transition-all font-black px-8 rounded-full h-10 md:h-14">
                              <a href={article.link} target="_blank" rel="noopener noreferrer">
                                EXPLORE <ArrowRight className="w-5 h-5 ml-2" />
                              </a>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                
                <div className="absolute bottom-6 right-8 flex gap-2 z-10 md:bottom-12 md:right-20">
                  {Array.from({ length: count }).map((_, index) => (
                    <button
                      key={index}
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-500",
                        current === index ? "bg-primary w-12" : "bg-white/20 w-4 hover:bg-white/40"
                      )}
                      onClick={() => api?.scrollTo(index)}
                    />
                  ))}
                </div>
              </Carousel>
            </section>
          )}

          <section>
            <div className="mb-6 md:mb-12 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
              <div className="space-y-2">
                <h3 className="text-2xl md:text-4xl font-black uppercase tracking-tighter">Insights Stream</h3>
                <Tabs value={activeCategory} onValueChange={handleCategoryChange} className="w-full">
                  <TabsList className="bg-white/5 p-1 rounded-full border border-white/5 h-12">
                    <TabsTrigger value="All" className="rounded-full px-6 data-[state=active]:bg-primary data-[state=active]:text-white font-bold text-xs">All</TabsTrigger>
                    <TabsTrigger value="Reliable" className="rounded-full px-6 data-[state=active]:bg-primary data-[state=active]:text-white font-bold text-xs">Reliable</TabsTrigger>
                    <TabsTrigger value="Discovery" className="rounded-full px-6 data-[state=active]:bg-primary data-[state=active]:text-white font-bold text-xs">Discovery</TabsTrigger>
                    <TabsTrigger value="Bookmarks" className="rounded-full px-4 data-[state=active]:bg-primary data-[state=active]:text-white">
                      <Bookmark className="w-4 h-4" />
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              
              <div className="flex items-center gap-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest pb-2">
                <div className="flex items-center gap-2">
                  <Filter className="w-3 h-3 text-primary" />
                  <span>{filteredArticles.length} ACTIVE INSIGHTS</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
              {filteredArticles.length > 0 ? (
                filteredArticles.map((article, index) => (
                  <div 
                    key={article.id} 
                    className="animate-in fade-in slide-in-from-bottom-4 duration-700"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <FeedCard article={article} />
                  </div>
                ))
              ) : articlesLoading || isRefreshing ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="aspect-[4/5] rounded-[2.5rem] bg-white/5 animate-pulse" />
                ))
              ) : (
                <div className="col-span-full py-32 text-center glass-panel rounded-[3rem]">
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 text-primary mb-8 animate-float">
                    <RefreshCw className="w-10 h-10" />
                  </div>
                  <h3 className="text-3xl font-black mb-3 tracking-tighter uppercase">No Insights Found</h3>
                  <p className="text-muted-foreground text-sm max-w-xs mx-auto mb-10">AIエンジンを起動して、世界中の最新ニュースを収集・解析しましょう。</p>
                  <Button size="lg" className="rounded-full px-12 font-black h-12" onClick={handleRefresh}>
                    INITIALIZE SYNC
                  </Button>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      <AddSourceDialog 
        open={isAddSourceOpen} 
        onOpenChange={setIsAddSourceOpen} 
        onAdd={handleAddSource}
      />
    </div>
  );
}