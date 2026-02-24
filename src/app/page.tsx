
"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, RefreshCw, Filter, Sparkles, BrainCircuit, Bookmark, ArrowRight, ChevronLeft, ChevronRight, Clock, Calendar } from 'lucide-react';
import { DashboardSidebar } from '@/components/dashboard/Sidebar';
import { FeedCard } from '@/components/dashboard/FeedCard';
import { AddSourceDialog } from '@/components/dashboard/AddSourceDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { INITIAL_SOURCES, MOCK_ARTICLES } from './lib/mock-data';
import { Article, Category, FeedSource } from './lib/types';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFirestore, useCollection, useUser } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import Image from 'next/image';
import { format, formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function Home() {
  const { user } = useUser();
  const db = useFirestore();
  const autoplay = useRef(Autoplay({ delay: 5000, stopOnInteraction: true }));
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  
  // フィルタリング用の状態
  const [activeCategory, setActiveCategory] = useState<Category | 'All' | 'Bookmarks'>('All');
  const [selectedSourceName, setSelectedSourceName] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isAddSourceOpen, setIsAddSourceOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // カルーセルの状態監視
  useEffect(() => {
    if (!api) return;

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  // ハイドレーションエラー防止のため、クライアントサイドで初期化
  useEffect(() => {
    setLastUpdated(new Date());
  }, []);

  // Firestoreからカスタムソースを取得
  const sourcesQuery = useMemo(() => {
    if (!db || !user) return null;
    return collection(db, 'users', user.uid, 'sources');
  }, [db, user]);

  const { data: customSources = [] } = useCollection(sourcesQuery);

  // Firestoreからブックマークを取得
  const bookmarksQuery = useMemo(() => {
    if (!db || !user) return null;
    return collection(db, 'users', user.uid, 'bookmarks');
  }, [db, user]);

  const { data: bookmarkedItems = [] } = useCollection(bookmarksQuery);

  // すべてのソースを統合
  const allSources = useMemo(() => [
    ...INITIAL_SOURCES, 
    ...customSources.map(s => ({
      id: s.id,
      name: s.name,
      url: s.url,
      category: 'Custom' as Category
    }))
  ], [customSources]);

  // ブックマークデータをArticle形式に変換
  const bookmarkedArticles: Article[] = bookmarkedItems.map(b => ({
    id: b.id,
    title: b.title,
    content: b.content || '内容がありません',
    summary: b.summary,
    sourceName: b.sourceName,
    sourceUrl: '#',
    publishedAt: b.bookmarkedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    category: 'Reliable', 
    link: b.url,
    imageUrl: b.imageUrl || 'https://picsum.photos/seed/placeholder/800/400'
  }));

  const displayArticles = activeCategory === 'Bookmarks' ? bookmarkedArticles : MOCK_ARTICLES;

  // フィルタリングロジックの統合
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
      })
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  }, [displayArticles, activeCategory, selectedSourceName, searchQuery]);

  // ヒーロー用の最新5記事
  const heroArticles = useMemo(() => {
    return MOCK_ARTICLES.slice(0, 5);
  }, []);

  const handleAddSource = (newSource: Omit<FeedSource, 'id'>) => {
    if (!db || !user) return;
    addDoc(collection(db, 'users', user.uid, 'sources'), {
      ...newSource,
      createdAt: serverTimestamp(),
    });
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setLastUpdated(new Date());
    setTimeout(() => setIsRefreshing(false), 1500);
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
    <div className="flex min-h-screen bg-background text-foreground w-full">
      <DashboardSidebar 
        activeCategory={activeCategory} 
        selectedSourceName={selectedSourceName}
        onSelectSource={handleSourceSelect}
        sources={allSources}
        onAddSource={() => setIsAddSourceOpen(true)}
      />

      <main className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-40 w-full bg-background/60 backdrop-blur-xl border-b border-border/30 px-4 md:px-6 h-16 flex items-center justify-between gap-2 md:gap-4">
          <div className="flex items-center gap-2 md:gap-4">
            <SidebarTrigger className="hover:bg-muted/50 transition-colors shrink-0" />
            <div className="h-6 w-px bg-border/40 hidden xs:block" />
            <h2 className="font-headline text-sm md:text-lg font-bold text-foreground truncate max-w-[100px] xs:max-w-none">
              {headerTitle}
            </h2>
            
            {/* ライブインジケーター */}
            <div className="flex items-center gap-1.5 px-2 py-1 bg-primary/5 rounded-full border border-primary/10 animate-in fade-in slide-in-from-left-4 duration-1000">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
              <span className="text-[9px] md:text-[10px] font-bold text-primary/70 uppercase tracking-widest flex items-center gap-1">
                <span className="hidden xs:inline">LIVE</span> 
                <span className="hidden md:inline text-muted-foreground/40">•</span> 
                {lastUpdated ? format(lastUpdated, 'HH:mm:ss') : '--:--:--'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-1 justify-end max-w-xl">
            <div className="relative w-full max-w-[140px] xs:max-w-xs sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 md:w-4 md:h-4 text-muted-foreground" />
              <Input 
                className="pl-8 md:pl-10 bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary h-8 md:h-9 rounded-xl transition-all hover:bg-muted/50 text-xs md:text-sm" 
                placeholder="検索..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8 md:h-9 md:w-9 border-border/30 rounded-xl hover:bg-secondary/50 relative shrink-0"
              onClick={handleRefresh}
            >
              <RefreshCw className={`w-3.5 h-3.5 md:w-4 md:h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </header>

        <div className="flex-1 p-4 md:p-6 space-y-6 md:space-y-8 max-w-7xl mx-auto w-full">
          {/* ヒーローセクション - カルーセル表示 */}
          {activeCategory === 'All' && !selectedSourceName && !searchQuery && (
            <section className="relative group">
              <Carousel 
                className="w-full" 
                opts={{ loop: true }}
                plugins={[autoplay.current]}
                setApi={setApi}
              >
                <CarouselContent>
                  {heroArticles.map((article) => (
                    <CarouselItem key={article.id}>
                      <div className="relative h-[250px] xs:h-[300px] md:h-[450px] w-full overflow-hidden rounded-[2rem] md:rounded-[2.5rem] shadow-2xl">
                        <Image 
                          src={article.imageUrl || 'https://picsum.photos/seed/placeholder/800/400'} 
                          alt={article.title}
                          fill
                          className="object-cover"
                          priority
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                        
                        <div className="absolute bottom-0 left-0 p-6 md:p-12 w-full max-w-4xl">
                          <div className="flex items-center gap-3 mb-3 md:mb-4">
                            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-[8px] md:text-[10px] font-bold uppercase tracking-[0.2em] border border-white/20 text-white">
                              <Sparkles className="w-2.5 h-2.5 md:w-3 md:h-3 text-amber-300" />
                              注目
                            </div>
                            <div className="flex items-center gap-1.5 text-white/60 text-[8px] md:text-[10px] font-bold uppercase tracking-widest">
                              <Clock className="w-2.5 h-2.5 md:w-3 md:h-3" />
                              {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true, locale: ja })}
                            </div>
                          </div>
                          <h1 className="font-headline text-lg xs:text-xl md:text-4xl lg:text-5xl font-bold mb-2 md:mb-4 tracking-tight leading-[1.2] text-white line-clamp-2">
                            {article.title}
                          </h1>
                          <p className="text-white/70 text-[10px] md:text-base mb-4 md:mb-6 line-clamp-2 max-w-2xl font-medium hidden xs:block">
                            {article.content}
                          </p>
                          <div className="flex items-center gap-3 md:gap-4">
                            <Button asChild className="bg-white text-black hover:bg-white/90 font-bold px-4 md:px-6 rounded-xl h-9 md:h-11 text-xs md:text-sm">
                              <a href={article.link} target="_blank" rel="noopener noreferrer">
                                詳しく読む <ArrowRight className="w-3 h-3 md:w-4 md:h-4 ml-2" />
                              </a>
                            </Button>
                            <span className="text-white/50 text-[8px] md:text-xs font-bold uppercase tracking-widest truncate">{article.sourceName}</span>
                          </div>
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-4 md:left-6 opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 border-none text-white hover:bg-black/40 h-8 w-8" />
                <CarouselNext className="right-4 md:right-6 opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 border-none text-white hover:bg-black/40 h-8 w-8" />
                
                {/* ページネーションインジケーター */}
                <div className="absolute bottom-4 right-8 flex gap-1.5 z-10 md:bottom-8 md:right-12">
                  {Array.from({ length: count }).map((_, index) => (
                    <button
                      key={index}
                      className={cn(
                        "w-1.5 h-1.5 rounded-full transition-all duration-300",
                        current === index ? "bg-white w-4" : "bg-white/30"
                      )}
                      onClick={() => api?.scrollTo(index)}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              </Carousel>
            </section>
          )}

          {/* メインフィード */}
          <section>
            <div className="mb-6 md:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <Tabs value={activeCategory} onValueChange={handleCategoryChange} className="w-full sm:w-auto">
                <TabsList className="bg-muted/40 p-1 rounded-xl w-full sm:w-auto">
                  <TabsTrigger value="All" className="flex-1 sm:flex-none rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm font-semibold text-[10px] md:text-xs">タイムライン</TabsTrigger>
                  <TabsTrigger value="Reliable" className="flex-1 sm:flex-none rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm font-semibold text-[10px] md:text-xs">信頼済み</TabsTrigger>
                  <TabsTrigger value="Discovery" className="flex-1 sm:flex-none rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm font-semibold text-[10px] md:text-xs">発見</TabsTrigger>
                  <TabsTrigger value="Bookmarks" className="flex-1 sm:flex-none rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm font-semibold text-[10px] md:text-xs flex items-center gap-1 justify-center">
                    <Bookmark className="w-3 h-3" />
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              
              <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest ml-auto sm:ml-0">
                <div className="flex items-center gap-1.5">
                  <Filter className="w-3 h-3" />
                  <span>{filteredArticles.length} インサイト</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-8">
              {filteredArticles.length > 0 ? (
                filteredArticles.map((article) => (
                  <FeedCard key={article.id} article={article} />
                ))
              ) : (
                <div className="col-span-full py-24 md:py-32 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-muted/30 text-muted-foreground mb-6">
                    <Filter className="w-8 h-8 md:w-10 md:h-10" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold mb-2 tracking-tight">データが見つかりません</h3>
                  <p className="text-muted-foreground text-sm max-w-xs mx-auto mb-8 px-4">条件に合う記事が存在しないか、まだデータが同期されていません。</p>
                  <Button variant="outline" className="rounded-xl px-8" onClick={() => {setSearchQuery(''); handleCategoryChange('All');}}>
                    全データを表示
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
