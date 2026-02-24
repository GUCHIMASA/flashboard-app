
"use client";

import React, { useState, useMemo } from 'react';
import { Search, RefreshCw, Filter, Sparkles, BrainCircuit, Bookmark } from 'lucide-react';
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

export default function Home() {
  const { user } = useUser();
  const db = useFirestore();
  
  const [activeCategory, setActiveCategory] = useState<Category | 'All' | 'Bookmarks'>('All');
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

  const allSources = [...INITIAL_SOURCES, ...customSources.map(s => ({
    id: s.id,
    name: s.name,
    url: s.url,
    category: 'Custom' as Category
  }))];

  // ブックマークされた記事をArticle型に変換して表示用リストを作成
  const bookmarkedArticles: Article[] = bookmarkedItems.map(b => ({
    id: b.id,
    title: b.title,
    content: b.content || '内容がありません',
    summary: b.summary,
    sourceName: b.sourceName,
    sourceUrl: '#',
    publishedAt: b.bookmarkedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    category: 'Reliable', // 仮
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
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1500);
  };

  const categoryLabels: Record<string, string> = {
    'All': 'すべて',
    'Reliable': '信頼済み',
    'Discovery': '発見',
    'Custom': 'カスタム',
    'Bookmarks': 'ブックマーク'
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground selection:bg-accent/30">
      <DashboardSidebar 
        activeCategory={activeCategory === 'Bookmarks' ? 'All' : activeCategory as any} 
        setActiveCategory={(cat) => setActiveCategory(cat as any)} 
        sources={allSources}
        onAddSource={() => setIsAddSourceOpen(true)}
      />

      <main className="flex-1 flex flex-col">
        <header className="sticky top-0 z-30 w-full bg-background/80 backdrop-blur-md border-b border-border/50 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <h2 className="font-headline text-2xl font-bold text-primary whitespace-nowrap">
              {categoryLabels[activeCategory]} フィード
            </h2>
            <div className="hidden lg:flex items-center gap-2 bg-secondary/40 px-3 py-1 rounded-full text-xs font-medium text-muted-foreground">
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              たった今更新
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64 lg:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                className="pl-10 bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary shadow-inner" 
                placeholder="AIのインサイトを検索..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button 
              variant="outline" 
              size="icon" 
              className="hidden sm:flex border-border/50 bg-background hover:bg-secondary/20"
              onClick={handleRefresh}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </header>

        {activeCategory === 'All' && !searchQuery && (
          <div className="px-6 pt-8 pb-4">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-accent p-8 text-primary-foreground shadow-xl">
              <div className="relative z-10 max-w-2xl">
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
                  <Sparkles className="w-3 h-3" />
                  AIの最新動向
                </div>
                <h1 className="font-headline text-4xl font-bold mb-4 tracking-tight leading-tight">
                  知性を解読し、<br/> 時代の最先端へ。
                </h1>
                <p className="text-primary-foreground/80 text-lg mb-6 leading-relaxed">
                  世界中の主要ラボやプラットフォームからリアルタイムで情報を集約。
                  Geminiが要約することで、圧倒的なスピードで情報を吸収できます。
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button className="bg-white text-primary hover:bg-white/90 font-bold px-6">
                    最新トレンドを分析
                  </Button>
                  <Button variant="outline" className="border-white/20 hover:bg-white/10 text-white px-6">
                    ソースを探索
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <Tabs value={activeCategory} onValueChange={(val) => setActiveCategory(val as any)}>
              <TabsList className="bg-muted/30 p-1">
                <TabsTrigger value="All" className="data-[state=active]:bg-background data-[state=active]:text-primary font-medium">タイムライン</TabsTrigger>
                <TabsTrigger value="Reliable" className="data-[state=active]:bg-background data-[state=active]:text-primary font-medium">信頼済み</TabsTrigger>
                <TabsTrigger value="Discovery" className="data-[state=active]:bg-background data-[state=active]:text-primary font-medium">発見</TabsTrigger>
                <TabsTrigger value="Custom" className="data-[state=active]:bg-background data-[state=active]:text-primary font-medium">カスタム</TabsTrigger>
                <TabsTrigger value="Bookmarks" className="data-[state=active]:bg-background data-[state=active]:text-primary font-medium flex items-center gap-1">
                  <Bookmark className="w-3 h-3" /> ブックマーク
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="w-4 h-4" />
              <span>{filteredArticles.length} 件の結果</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredArticles.length > 0 ? (
              filteredArticles.map((article) => (
                <FeedCard key={article.id} article={article} />
              ))
            ) : (
              <div className="col-span-full py-20 text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary/40 text-muted-foreground">
                  <Search className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">結果が見つかりません</h3>
                  <p className="text-muted-foreground">フィルターを変更するか、別のキーワードで検索してください。</p>
                </div>
                <Button variant="outline" onClick={() => {setSearchQuery(''); setActiveCategory('All');}}>
                  すべてのフィルターをクリア
                </Button>
              </div>
            )}
          </div>
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
