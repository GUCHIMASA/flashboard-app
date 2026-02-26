
"use client";

import React, { useState, useMemo, useRef } from 'react';
import { Bookmark, Calendar, Info, Database, Zap } from 'lucide-react';
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
import Link from 'next/link';

// 管理者用メールアドレス
const ADMIN_EMAIL = 'kawa_guchi_masa_hiro@yahoo.co.jp';

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
  const [activeArticleId, setActiveArticleId] = useState<string | null>(null);

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
  const { data: firestoreArticles, isLoading: articlesLoading } = useCollection(articlesQuery);

  const normalizedArticles = useMemo(() => {
    if (!firestoreArticles) return [];
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
        imageUrl: a.imageUrl || `https://picsum.photos/seed/${encodeURIComponent(a.title?.substring(0,5) || a.id)}/800/400`,
        tags: a.tags || []
      } as Article;
    });
  }, [firestoreArticles]);

  const bookmarkedItemsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, 'users', user.uid, 'bookmarks');
  }, [db, user]);
  const { data: bookmarkedItems } = useCollection(bookmarkedItemsQuery);

  const bookmarkedArticles: Article[] = (bookmarkedItems || []).map((b: any) => ({
    id: b.id,
    title: b.title || '無題',
    translatedTitle: b.translatedTitle,
    content: b.content || '',
    act: b.act,
    context: b.context,
    effect: b.effect,
    sourceName: b.sourceName || '不明',
    publishedAt: b.bookmarkedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    category: 'Bookmarks', 
    link: b.link || b.url || '#',
    imageUrl: b.imageUrl || `https://picsum.photos/seed/${b.id}/800/400`,
    tags: b.tags || []
  }));

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

  // ロード中フラッシュ防止
  const isInitialLoading = articlesLoading && normalizedArticles.length === 0;

  const handleRefresh = async () => {
    if (isRefreshing) return;
    
    if (user?.email !== ADMIN_EMAIL) {
      toast({ variant: "destructive", title: "権限エラー", description: "管理者のみ実行可能です。" });
      return;
    }

    setIsRefreshing(true);
    toast({ title: "同期を開始しました", description: "最新情報を処理中..." });

    try {
      const result = await syncRss({ 
        sources: allSources,
        requesterEmail: user?.email || ''
      });
      toast({ title: "同期完了", description: `${result.addedCount + result.updatedCount}件処理しました。` });
    } catch (error: any) {
      toast({ variant: "destructive", title: "同期エラー", description: error.message });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSourceSelect = (source: FeedSource | 'All') => {
    // トグル動作: すでに選択されているソースをクリックした場合は解除
    if (source === 'All') {
      setActiveCategory('All');
      setSelectedSourceName(null);
    } else if (source.id === 'bookmarks') {
      setActiveCategory('Bookmarks');
      setSelectedSourceName(null);
    } else if (selectedSourceName === source.name) {
      // 選択解除
      setActiveCategory('All');
      setSelectedSourceName(null);
    } else {
      // 新規選択
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
        onAddSource={() => user ? setIsAddSourceOpen(true) : toast({ variant: "destructive", title: "ログインが必要です" })}
      />

      <main className="flex-1 flex flex-col min-w-0 max-w-full overflow-x-hidden">
        <Header />
        
        {/* フルワイド・ヒーロースライダー */}
        {!isInitialLoading && filteredArticles.length > 0 ? (
          <section className="relative w-full border-b border-white/5">
            <Carousel className="w-full" opts={{ loop: true }} plugins={[autoplay.current]} setApi={setApi}>
              <CarouselContent>
                {filteredArticles.slice(0, 5).map((article) => (
                  <CarouselItem key={article.id}>
                    <div className="relative h-[300px] md:h-[500px] w-full overflow-hidden">
                      <Image 
                        src={article.imageUrl || `https://picsum.photos/seed/${article.id}/1200/800`} 
                        alt={article.title}
                        fill
                        className="object-cover"
                        priority
                        sizes="100vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                      <div className="absolute bottom-0 left-0 p-6 md:p-16 w-full max-w-[1600px] mx-auto right-0">
                        <div className="flex items-center gap-3 mb-3">
                          <Badge className="bg-primary border-none text-[10px] md:text-xs h-6 md:h-7 px-3">{article.sourceName}</Badge>
                          <span className="text-xs md:text-sm text-white/70 font-bold flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            {format(new Date(article.publishedAt), 'yyyy/MM/dd HH:mm')}
                          </span>
                        </div>
                        <h1 className="text-2xl md:text-5xl font-black mb-4 text-white line-clamp-2 leading-tight tracking-tighter">
                          {article.translatedTitle || article.title}
                        </h1>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </section>
        ) : isInitialLoading ? (
          <section className="relative w-full h-[300px] md:h-[500px] bg-muted animate-pulse border-b border-white/5" />
        ) : null}

        <div className="flex-1 p-4 md:p-8 space-y-6 max-w-[1600px] mx-auto w-full">
          <section className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v)} className="bg-muted p-1 rounded-full border border-white/5 shadow-inner">
                  <TabsList className="bg-transparent h-10">
                    <TabsTrigger value="All" className="rounded-full px-5 text-sm font-black data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">すべて</TabsTrigger>
                    <TabsTrigger value="Reliable" className="rounded-full px-5 text-sm font-black data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">信頼</TabsTrigger>
                    <TabsTrigger value="Discovery" className="rounded-full px-5 text-sm font-black data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">発見</TabsTrigger>
                    <TabsTrigger value="Bookmarks" className="rounded-full px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      <Bookmark className="w-4 h-4" />
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="bg-muted px-4 py-2 rounded-full text-xs font-black text-muted-foreground flex items-center gap-2 border border-white/5">
                  <Database className="w-3.5 h-3.5 text-primary" />
                  {isInitialLoading ? "LOADING..." : `${filteredArticles.length} ARTICLES`}
                </div>
                {user?.email === ADMIN_EMAIL && (
                  <Button variant="outline" size="sm" className="rounded-full h-10 px-6 text-xs font-black border-primary/30 hover:bg-primary/5" onClick={handleRefresh} disabled={isRefreshing}>
                    {isRefreshing ? "SYNCING..." : "SYNC NOW"}
                  </Button>
                )}
              </div>
            </div>

            {isInitialLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="h-64 rounded-2xl bg-muted animate-pulse border border-white/5" />
                ))}
              </div>
            ) : filteredArticles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredArticles.map((article) => (
                  <div 
                    key={article.id} 
                    onClick={() => setActiveArticleId(activeArticleId === article.id ? null : article.id)}
                    className="transition-all duration-300"
                  >
                    <FeedCard 
                      article={article} 
                      isActive={activeArticleId === article.id}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-24 text-center bg-muted/10 rounded-[2.5rem] border border-dashed border-white/10">
                <Info className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-xl font-black mb-2">該当する記事はありません</h3>
                <p className="text-sm text-muted-foreground">条件を変更して再度お試しください。</p>
              </div>
            )}
          </section>

          <footer className="py-16 border-t border-white/5 text-center space-y-6 mt-12">
            <div className="flex items-center justify-center gap-10">
              <Link href="/terms" className="text-xs font-black text-muted-foreground hover:text-primary transition-colors tracking-widest">利用規約</Link>
              <Link href="/privacy" className="text-xs font-black text-muted-foreground hover:text-primary transition-colors tracking-widest">プライバシーポリシー</Link>
            </div>
            <p className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.3em]">
              © 2024 FLASHBOARD
            </p>
          </footer>
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
