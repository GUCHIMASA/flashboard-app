
"use client";

import React, { useState, useMemo } from 'react';
import { Search, RefreshCw, Filter, Sparkles, BrainCircuit, Bookmark, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
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
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import Image from 'next/image';

export default function Home() {
  const { user } = useUser();
  const db = useFirestore();
  
  // フィルタリング用の状態
  const [activeCategory, setActiveCategory] = useState<Category | 'All' | 'Bookmarks'>('All');
  const [selectedSourceName, setSelectedSourceName] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isAddSourceOpen, setIsAddSourceOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
    if (activeCategory === 'Bookmarks') return 'ブックマーク一覧';
    if (selectedSourceName) return selectedSourceName;
    const labels: Record<string, string> = {
      'All': 'タイムライン',
      'Reliable': '信頼済みソース',
      'Discovery': '発見ソース',
      'Custom': 'カスタムソース'
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
        <header className="sticky top-0 z-40 w-full bg-background/60 backdrop-blur-xl border-b border-border/30 px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="hover:bg-muted/50 transition-colors" />
            <div className="h-6 w-px bg-border/40 hidden sm:block" />
            <h2 className="font-headline text-lg font-bold text-foreground hidden sm:block">
              {headerTitle}
            </h2>
          </div>

          <div className="flex items-center gap-3 flex-1 justify-end max-w-xl">
            <div className="relative w-full max-w-xs sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                className="pl-10 bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary h-9 rounded-xl transition-all hover:bg-muted/50" 
                placeholder="インサイトを検索..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-9 w-9 border-border/30 rounded-xl hover:bg-secondary/50"
              onClick={handleRefresh}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </header>

        <div className="flex-1 p-6 space-y-8 max-w-7xl mx-auto w-full">
          {/* ヒーローセクション - カルーセル表示 */}
          {activeCategory === 'All' && !selectedSourceName && !searchQuery && (
            <section className="relative group">
              <Carousel className="w-full" opts={{ loop: true }}>
                <CarouselContent>
                  {heroArticles.map((article) => (
                    <CarouselItem key={article.id}>
                      <div className="relative h-[300px] md:h-[450px] w-full overflow-hidden rounded-[2.5rem] shadow-2xl">
                        {/* 背景画像 */}
                        <Image 
                          src={article.imageUrl || 'https://picsum.photos/seed/placeholder/800/400'} 
                          alt={article.title}
                          fill
                          className="object-cover"
                          priority
                        />
                        {/* グラデーションオーバーレイ */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                        
                        {/* コンテンツ */}
                        <div className="absolute bottom-0 left-0 p-8 md:p-12 w-full max-w-4xl">
                          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] mb-4 border border-white/20 text-white">
                            <Sparkles className="w-3 h-3 text-amber-300" />
                            注目ニュース
                          </div>
                          <h1 className="font-headline text-2xl md:text-4xl lg:text-5xl font-bold mb-4 tracking-tight leading-[1.2] text-white">
                            {article.title}
                          </h1>
                          <p className="text-white/70 text-sm md:text-base mb-6 line-clamp-2 max-w-2xl font-medium">
                            {article.content}
                          </p>
                          <div className="flex items-center gap-4">
                            <Button asChild className="bg-white text-black hover:bg-white/90 font-bold px-6 rounded-xl h-11">
                              <a href={article.link} target="_blank" rel="noopener noreferrer">
                                詳しく読む <ArrowRight className="w-4 h-4 ml-2" />
                              </a>
                            </Button>
                            <span className="text-white/50 text-xs font-bold uppercase tracking-widest">{article.sourceName}</span>
                          </div>
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-6 opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 border-none text-white hover:bg-black/40" />
                <CarouselNext className="right-6 opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 border-none text-white hover:bg-black/40" />
              </Carousel>
            </section>
          )}

          {/* メインフィード */}
          <section>
            <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <Tabs value={activeCategory} onValueChange={handleCategoryChange} className="w-full sm:w-auto">
                <TabsList className="bg-muted/40 p-1 rounded-xl">
                  <TabsTrigger value="All" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm font-semibold text-xs">タイムライン</TabsTrigger>
                  <TabsTrigger value="Reliable" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm font-semibold text-xs">信頼済み</TabsTrigger>
                  <TabsTrigger value="Discovery" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm font-semibold text-xs">発見</TabsTrigger>
                  <TabsTrigger value="Bookmarks" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm font-semibold text-xs flex items-center gap-1">
                    <Bookmark className="w-3 h-3" />
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              
              <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">
                <div className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5" />
                  <span>{filteredArticles.length} 記事</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredArticles.length > 0 ? (
                filteredArticles.map((article) => (
                  <FeedCard key={article.id} article={article} />
                ))
              ) : (
                <div className="col-span-full py-32 text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-muted/30 text-muted-foreground mb-6">
                    <Filter className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2 tracking-tight">データが見つかりません</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto mb-8">条件に合う記事が存在しないか、まだデータが同期されていません。</p>
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
