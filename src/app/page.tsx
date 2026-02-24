"use client";

import React, { useState, useMemo } from 'react';
import { Search, RefreshCw, Filter, Sparkles, BrainCircuit, Bookmark, Sidebar as SidebarIcon } from 'lucide-react';
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

export default function Home() {
  const { user } = useUser();
  const db = useFirestore();
  
  const [activeCategory, setActiveCategory] = useState<Category | 'All' | 'Bookmarks'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddSourceOpen, setIsAddSourceOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const sourcesQuery = useMemo(() => {
    if (!db || !user) return null;
    return collection(db, 'users', user.uid, 'sources');
  }, [db, user]);

  const { data: customSources = [] } = useCollection(sourcesQuery);

  const bookmarksQuery = useMemo(() => {
    if (!db || !user) return null;
    return collection(db, 'users', user.uid, 'bookmarks');
  }, [db, user]);

  const { data: bookmarkedItems = [] } = useCollection(bookmarksQuery);

  const allSources = [...INITIAL_SOURCES, ...customSources.map(s => ({
    id: s.id,
    name: s.name,
    url: s.url,
    category: 'Custom' as Category
  }))];

  const bookmarkedArticles: Article[] = bookmarkedItems.map(b => ({
    id: b.id,
    title: b.title,
    content: b.content || '内容がありません',
    summary: b.summary,
    sourceName: b.sourceName,
    sourceUrl: '#',
    publishedAt: b.bookmarkedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    category: 'Reliable',
    link: b.url
  }));

  const displayArticles = activeCategory === 'Bookmarks' ? bookmarkedArticles : MOCK_ARTICLES;

  const filteredArticles = displayArticles
    .filter(a => activeCategory === 'All' || activeCategory === 'Bookmarks' || a.category === activeCategory)
    .filter(a => 
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      a.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.sourceName.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

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

  const categoryLabels: Record<string, string> = {
    'All': 'タイムライン',
    'Reliable': '信頼済みソース',
    'Discovery': '発見ソース',
    'Custom': 'カスタムソース',
    'Bookmarks': 'ブックマーク一覧'
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground w-full">
      <DashboardSidebar 
        activeCategory={activeCategory} 
        setActiveCategory={setActiveCategory} 
        sources={allSources}
        onAddSource={() => setIsAddSourceOpen(true)}
      />

      <main className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-40 w-full bg-background/60 backdrop-blur-xl border-b border-border/30 px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="hover:bg-muted/50 transition-colors" />
            <div className="h-6 w-px bg-border/40 hidden sm:block" />
            <h2 className="font-headline text-lg font-bold text-foreground hidden sm:block">
              {categoryLabels[activeCategory]}
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
          {activeCategory === 'All' && !searchQuery && (
            <section className="relative overflow-hidden rounded-3xl bg-primary shadow-2xl shadow-primary/20">
              <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/80 to-accent opacity-90" />
              <div className="relative z-10 p-8 md:p-12 text-primary-foreground max-w-3xl">
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-lg px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] mb-6 border border-white/10">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  次世代の情報集約ツール
                </div>
                <h1 className="font-headline text-3xl md:text-5xl font-bold mb-6 tracking-tight leading-[1.1]">
                  知性を整理し、<br/><span className="text-white/70">本質を突き止める。</span>
                </h1>
                <p className="text-primary-foreground/70 text-base md:text-lg mb-8 leading-relaxed font-medium">
                  グローバルなAIニュースをリアルタイムでキャッチ。
                  Geminiが複雑な文脈を読み解き、あなたに最適なエッセンスを届けます。
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button className="bg-white text-primary hover:bg-white/90 font-bold px-8 rounded-xl h-12 shadow-lg">
                    最新をチェック
                  </Button>
                  <Button variant="outline" className="border-white/20 hover:bg-white/10 text-white px-8 rounded-xl h-12">
                    使い方を見る
                  </Button>
                </div>
              </div>
              <div className="absolute right-0 top-0 h-full w-1/3 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)] from-white/10 hidden lg:block" />
            </section>
          )}

          <section>
            <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <Tabs value={activeCategory} onValueChange={(val) => setActiveCategory(val as any)} className="w-full sm:w-auto">
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
                  <span>{filteredArticles.length} Inserts</span>
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
                    <Search className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2 tracking-tight">データが見つかりません</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto mb-8">条件に合う記事が存在しないか、まだブックマークがありません。</p>
                  <Button variant="outline" className="rounded-xl px-8" onClick={() => {setSearchQuery(''); setActiveCategory('All');}}>
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
